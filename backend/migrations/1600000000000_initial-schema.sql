--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Homebrew)
-- Dumped by pg_dump version 17.5 (Homebrew)

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_provider_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_provider_type (
    id integer NOT NULL,
    provider_name text NOT NULL
);


--
-- Name: auth_provider_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auth_provider_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auth_provider_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auth_provider_type_id_seq OWNED BY public.auth_provider_type.id;


--
-- Name: profile_link_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_link_type (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: profile_link_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_link_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_link_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_link_type_id_seq OWNED BY public.profile_link_type.id;


--
-- Name: profile_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_links (
    id uuid NOT NULL,
    profile_id uuid NOT NULL,
    link_type_id integer NOT NULL,
    url text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    link_label text
);


--
-- Name: profile_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_type (
    id integer NOT NULL,
    type_name text NOT NULL
);


--
-- Name: profile_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.profile_type_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_type_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.profile_type_id_seq OWNED BY public.profile_type.id;


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    first_name text,
    last_name text,
    username text,
    avatar_url text,
    banner_url text,
    bio text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expertise text,
    collectif_name text,
    profile_type_id integer,
    derived_public_key text,
    derived_address text,
    website text,
    is_claimed boolean DEFAULT false NOT NULL,
    invitation_email text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: project_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_links (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    url text NOT NULL
);


--
-- Name: project_participant_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_participant_role (
    id integer NOT NULL,
    role_name text NOT NULL
);


--
-- Name: project_participant_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_participant_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_participant_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_participant_role_id_seq OWNED BY public.project_participant_role.id;


--
-- Name: project_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_participants (
    id uuid NOT NULL,
    project_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role_id integer NOT NULL,
    contribution integer DEFAULT 0 NOT NULL,
    contribution_description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_signed boolean DEFAULT false,
    signature text,
    signed_at timestamp with time zone,
    nft_address text,
    nft_token_id text,
    nft_token_uri text
);


--
-- Name: project_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_status (
    id integer NOT NULL,
    status_name text NOT NULL
);


--
-- Name: project_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.project_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: project_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.project_status_id_seq OWNED BY public.project_status.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid NOT NULL,
    title text NOT NULL,
    description text,
    due_date date,
    banner_url text,
    category text,
    client text,
    testimonial text,
    status_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    stringified text,
    hash text,
    url text,
    nft_img text
);


--
-- Name: user_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_auth (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider_id integer NOT NULL,
    provider_user_id text NOT NULL,
    hashed_login text NOT NULL,
    hashed_password text NOT NULL,
    refresh_token text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: wallet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet (
    id text NOT NULL,
    user_id uuid NOT NULL,
    encrypted_private_key text NOT NULL,
    public_key text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT wallet_id_check CHECK ((id ~ '^0x[0-9a-fA-F]{40}$'::text))
);


--
-- Name: auth_provider_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_provider_type ALTER COLUMN id SET DEFAULT nextval('public.auth_provider_type_id_seq'::regclass);


--
-- Name: profile_link_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_link_type ALTER COLUMN id SET DEFAULT nextval('public.profile_link_type_id_seq'::regclass);


--
-- Name: profile_type id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_type ALTER COLUMN id SET DEFAULT nextval('public.profile_type_id_seq'::regclass);


--
-- Name: project_participant_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participant_role ALTER COLUMN id SET DEFAULT nextval('public.project_participant_role_id_seq'::regclass);


--
-- Name: project_status id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status ALTER COLUMN id SET DEFAULT nextval('public.project_status_id_seq'::regclass);


--
-- Data for Name: auth_provider_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.auth_provider_type (id, provider_name) VALUES
(1, 'email'),
(2, 'google'),
(3, 'github');


--
-- Data for Name: profile_link_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profile_link_type (id, name) VALUES
(1, 'linkedin'),
(2, 'github'),
(3, 'instagram'),
(4, 'facebook'),
(5, 'youtube'),
(6, 'discord'),
(7, 'slack'),
(8, 'dribbble'),
(9, 'behance'),
(10, 'strava'),
(11, 'twitter'),
(12, 'website'),
(13, 'spotify');


--
-- Data for Name: profile_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.profile_type (id, type_name) VALUES
(1, 'individual'),
(2, 'collectif');


--
-- Data for Name: project_participant_role; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_participant_role (id, role_name) VALUES
(1, 'teamLeader'),
(2, 'contributor'),
(3, 'observer');


--
-- Data for Name: project_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.project_status (id, status_name) VALUES
(1, 'inProgress'),
(2, 'delivered'),
(3, 'frozen'),
(4, 'completed');


--
-- Name: auth_provider_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_provider_type_id_seq', 3, true);


--
-- Name: profile_link_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profile_link_type_id_seq', 12, true);


--
-- Name: profile_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.profile_type_id_seq', 2, true);


--
-- Name: project_participant_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_participant_role_id_seq', 3, true);


--
-- Name: project_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.project_status_id_seq', 4, true);


--
-- Name: auth_provider_type auth_provider_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_provider_type
    ADD CONSTRAINT auth_provider_type_pkey PRIMARY KEY (id);


--
-- Name: auth_provider_type auth_provider_type_provider_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_provider_type
    ADD CONSTRAINT auth_provider_type_provider_name_key UNIQUE (provider_name);


--
-- Name: profile_link_type profile_link_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_link_type
    ADD CONSTRAINT profile_link_type_name_key UNIQUE (name);


--
-- Name: profile_link_type profile_link_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_link_type
    ADD CONSTRAINT profile_link_type_pkey PRIMARY KEY (id);


--
-- Name: profile_links profile_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_links
    ADD CONSTRAINT profile_links_pkey PRIMARY KEY (id);


--
-- Name: profile_type profile_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_type
    ADD CONSTRAINT profile_type_pkey PRIMARY KEY (id);


--
-- Name: profile_type profile_type_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_type
    ADD CONSTRAINT profile_type_type_name_key UNIQUE (type_name);


--
-- Name: profiles profiles_invitation_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_invitation_email_key UNIQUE (invitation_email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_username_key UNIQUE (username);


--
-- Name: project_links project_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_links
    ADD CONSTRAINT project_links_pkey PRIMARY KEY (id);


--
-- Name: project_participant_role project_participant_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participant_role
    ADD CONSTRAINT project_participant_role_pkey PRIMARY KEY (id);


--
-- Name: project_participant_role project_participant_role_role_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participant_role
    ADD CONSTRAINT project_participant_role_role_name_key UNIQUE (role_name);


--
-- Name: project_participants project_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participants
    ADD CONSTRAINT project_participants_pkey PRIMARY KEY (id);


--
-- Name: project_status project_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status
    ADD CONSTRAINT project_status_pkey PRIMARY KEY (id);


--
-- Name: project_status project_status_status_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_status
    ADD CONSTRAINT project_status_status_name_key UNIQUE (status_name);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: user_auth user_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth
    ADD CONSTRAINT user_auth_pkey PRIMARY KEY (id);


--
-- Name: user_auth user_auth_provider_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth
    ADD CONSTRAINT user_auth_provider_user_id_key UNIQUE (provider_user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallet wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_pkey PRIMARY KEY (id);


--
-- Name: profile_links profile_links_link_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_links
    ADD CONSTRAINT profile_links_link_type_id_fkey FOREIGN KEY (link_type_id) REFERENCES public.profile_link_type(id);


--
-- Name: profile_links profile_links_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_links
    ADD CONSTRAINT profile_links_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_profile_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_profile_type_id_fkey FOREIGN KEY (profile_type_id) REFERENCES public.profile_type(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_links project_links_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_links
    ADD CONSTRAINT project_links_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_participants project_participants_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participants
    ADD CONSTRAINT project_participants_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: project_participants project_participants_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participants
    ADD CONSTRAINT project_participants_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_participants project_participants_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_participants
    ADD CONSTRAINT project_participants_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.project_participant_role(id) ON DELETE RESTRICT;


--
-- Name: projects projects_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.project_status(id) ON DELETE SET NULL;


--
-- Name: user_auth user_auth_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth
    ADD CONSTRAINT user_auth_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.auth_provider_type(id) ON DELETE CASCADE;


--
-- Name: user_auth user_auth_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_auth
    ADD CONSTRAINT user_auth_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: wallet wallet_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
