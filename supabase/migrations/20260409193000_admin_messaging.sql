-- Admin / super-admin messaging: direct & group conversations, messages, RLS

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('direct', 'group')),
  title text,
  direct_user_a uuid,
  direct_user_b uuid,
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_message_at timestamptz,
  CONSTRAINT chat_conversations_direct_ck CHECK (
    (kind = 'direct' AND direct_user_a IS NOT NULL AND direct_user_b IS NOT NULL AND direct_user_a < direct_user_b)
    OR (kind = 'group' AND direct_user_a IS NULL AND direct_user_b IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_direct_pair_uidx
  ON public.chat_conversations (direct_user_a, direct_user_b)
  WHERE kind = 'direct';

CREATE TABLE IF NOT EXISTS public.chat_conversation_members (
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS chat_conversation_members_user_id_idx
  ON public.chat_conversation_members (user_id);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_conv_created_idx
  ON public.chat_messages (conversation_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.chat_is_conversation_member(p_conversation_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_conversation_members m
    WHERE m.conversation_id = p_conversation_id AND m.user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.chat_is_staff_messaging()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin() OR public.is_org_admin();
$$;

CREATE OR REPLACE FUNCTION public.chat_touch_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_conversations
  SET
    updated_at = now(),
    last_message_at = NEW.created_at,
    last_message_preview = left(trim(both from NEW.body), 200)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_message_touch_conv ON public.chat_messages;
CREATE TRIGGER trg_chat_message_touch_conv
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.chat_touch_conversation_on_message();

-- Get or create 1:1 conversation (staff only). Pair key: ordered user ids.
CREATE OR REPLACE FUNCTION public.chat_get_or_create_direct(p_peer_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u1 uuid := least(auth.uid(), p_peer_user_id);
  u2 uuid := greatest(auth.uid(), p_peer_user_id);
  conv_id uuid;
BEGIN
  IF NOT public.chat_is_staff_messaging() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF p_peer_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Invalid peer';
  END IF;
  SELECT c.id INTO conv_id
  FROM public.chat_conversations c
  WHERE c.kind = 'direct' AND c.direct_user_a = u1 AND c.direct_user_b = u2;
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;
  INSERT INTO public.chat_conversations (kind, title, direct_user_a, direct_user_b, created_by)
  VALUES ('direct', NULL, u1, u2, auth.uid())
  RETURNING id INTO conv_id;
  INSERT INTO public.chat_conversation_members (conversation_id, user_id)
  VALUES (conv_id, u1), (conv_id, u2)
  ON CONFLICT DO NOTHING;
  RETURN conv_id;
END;
$$;

-- Create named group; creator + listed members (deduped). Staff only.
CREATE OR REPLACE FUNCTION public.chat_create_group(p_title text, p_member_user_ids uuid[])
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
  t text := nullif(trim(both from coalesce(p_title, '')), '');
  uid uuid;
BEGIN
  IF NOT public.chat_is_staff_messaging() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF t IS NULL THEN
    RAISE EXCEPTION 'Title required';
  END IF;
  INSERT INTO public.chat_conversations (kind, title, created_by)
  VALUES ('group', t, auth.uid())
  RETURNING id INTO conv_id;
  INSERT INTO public.chat_conversation_members (conversation_id, user_id)
  VALUES (conv_id, auth.uid())
  ON CONFLICT DO NOTHING;
  FOREACH uid IN ARRAY coalesce(p_member_user_ids, ARRAY[]::uuid[]) LOOP
    IF uid IS NOT NULL AND uid <> auth.uid() THEN
      INSERT INTO public.chat_conversation_members (conversation_id, user_id)
      VALUES (conv_id, uid)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
  RETURN conv_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_add_group_members(p_conversation_id uuid, p_user_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
  uid uuid;
BEGIN
  IF NOT public.chat_is_staff_messaging() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT kind INTO k FROM public.chat_conversations WHERE id = p_conversation_id;
  IF k IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;
  IF k <> 'group' THEN
    RAISE EXCEPTION 'Only group chats accept new members';
  END IF;
  FOREACH uid IN ARRAY coalesce(p_user_ids, ARRAY[]::uuid[]) LOOP
    IF uid IS NOT NULL THEN
      INSERT INTO public.chat_conversation_members (conversation_id, user_id)
      VALUES (p_conversation_id, uid)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chat_get_or_create_direct(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_create_group(text, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_add_group_members(uuid, uuid[]) TO authenticated;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_conv_select" ON public.chat_conversations;
CREATE POLICY "chat_conv_select" ON public.chat_conversations
  FOR SELECT TO authenticated
  USING (public.chat_is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "chat_conv_insert" ON public.chat_conversations;
CREATE POLICY "chat_conv_insert" ON public.chat_conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.chat_is_staff_messaging()
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "chat_conv_update" ON public.chat_conversations;
CREATE POLICY "chat_conv_update" ON public.chat_conversations
  FOR UPDATE TO authenticated
  USING (
    public.chat_is_conversation_member(id, auth.uid())
    AND public.chat_is_staff_messaging()
  )
  WITH CHECK (
    public.chat_is_conversation_member(id, auth.uid())
    AND public.chat_is_staff_messaging()
  );

DROP POLICY IF EXISTS "chat_member_select" ON public.chat_conversation_members;
CREATE POLICY "chat_member_select" ON public.chat_conversation_members
  FOR SELECT TO authenticated
  USING (public.chat_is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "chat_member_insert" ON public.chat_conversation_members;
CREATE POLICY "chat_member_insert" ON public.chat_conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (public.chat_is_staff_messaging());

DROP POLICY IF EXISTS "chat_member_delete" ON public.chat_conversation_members;
CREATE POLICY "chat_member_delete" ON public.chat_conversation_members
  FOR DELETE TO authenticated
  USING (public.chat_is_staff_messaging());

DROP POLICY IF EXISTS "chat_msg_select" ON public.chat_messages;
CREATE POLICY "chat_msg_select" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (public.chat_is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "chat_msg_insert" ON public.chat_messages;
CREATE POLICY "chat_msg_insert" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.chat_is_conversation_member(conversation_id, auth.uid())
  );

GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.chat_conversation_members TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
