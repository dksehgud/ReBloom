--
-- PostgreSQL database cluster dump
--

\restrict gnpEGuFlKH6cPyVBsbQtYR3bUBNGqN5tfM8dCmAq0YG6YS5Rg1Z1AvcLfAJEBuu

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE rebloom;
ALTER ROLE rebloom WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:4QIoQnnYYzP63kb7dICtRA==$H42Z+h9QN3yt9cJdztcY6Pn4/tcmvInlFk4BGqrDuSg=:r6Tcnq68odV0YmqxWDZPWnORen1hHnim1mgRDyrVh5o=';

--
-- User Configurations
--








\unrestrict gnpEGuFlKH6cPyVBsbQtYR3bUBNGqN5tfM8dCmAq0YG6YS5Rg1Z1AvcLfAJEBuu

--
-- Databases
--

--
-- Database "template1" dump
--

\connect template1

--
-- PostgreSQL database dump
--

\restrict wGTYgek8d40XnbNBAOTLGMBVRdkmJiSxevsTdLBHby9R04YIrucBHbAcqQMK8Ug

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict wGTYgek8d40XnbNBAOTLGMBVRdkmJiSxevsTdLBHby9R04YIrucBHbAcqQMK8Ug

--
-- Database "postgres" dump
--

\connect postgres

--
-- PostgreSQL database dump
--

\restrict zd5n2DaPt11XL8jLO41ehh92rcQOOC1qZQ2cOYYnKEMBmIyJhW524cPAWc313Bp

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict zd5n2DaPt11XL8jLO41ehh92rcQOOC1qZQ2cOYYnKEMBmIyJhW524cPAWc313Bp

--
-- Database "rebloom_ai" dump
--

--
-- PostgreSQL database dump
--

\restrict EpM5O9o3N2LrUUvg2h4u6VtDKPV5sbg4Eel1BMTf8XtvSUn8czedbMMOUYZuSs3

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rebloom_ai; Type: DATABASE; Schema: -; Owner: rebloom
--

CREATE DATABASE rebloom_ai WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rebloom_ai OWNER TO rebloom;

\unrestrict EpM5O9o3N2LrUUvg2h4u6VtDKPV5sbg4Eel1BMTf8XtvSUn8czedbMMOUYZuSs3
\connect rebloom_ai
\restrict EpM5O9o3N2LrUUvg2h4u6VtDKPV5sbg4Eel1BMTf8XtvSUn8czedbMMOUYZuSs3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- PostgreSQL database dump complete
--

\unrestrict EpM5O9o3N2LrUUvg2h4u6VtDKPV5sbg4Eel1BMTf8XtvSUn8czedbMMOUYZuSs3

--
-- Database "rebloom_auth" dump
--

--
-- PostgreSQL database dump
--

\restrict 2FLc0rGGANV3F7ydbNsgxq9roYTYfdULgJjSzK9vS6IyLDpndDBTsKZ2Mfyp2HF

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rebloom_auth; Type: DATABASE; Schema: -; Owner: rebloom
--

CREATE DATABASE rebloom_auth WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rebloom_auth OWNER TO rebloom;

\unrestrict 2FLc0rGGANV3F7ydbNsgxq9roYTYfdULgJjSzK9vS6IyLDpndDBTsKZ2Mfyp2HF
\connect rebloom_auth
\restrict 2FLc0rGGANV3F7ydbNsgxq9roYTYfdULgJjSzK9vS6IyLDpndDBTsKZ2Mfyp2HF

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth_schema; Type: SCHEMA; Schema: -; Owner: rebloom
--

CREATE SCHEMA auth_schema;


ALTER SCHEMA auth_schema OWNER TO rebloom;

--
-- Name: gender; Type: TYPE; Schema: auth_schema; Owner: rebloom
--

CREATE TYPE auth_schema.gender AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE auth_schema.gender OWNER TO rebloom;

--
-- Name: relation_status; Type: TYPE; Schema: auth_schema; Owner: rebloom
--

CREATE TYPE auth_schema.relation_status AS ENUM (
    'ACTIVE',
    'PENDING',
    'REJECT'
);


ALTER TYPE auth_schema.relation_status OWNER TO rebloom;

--
-- Name: user_role; Type: TYPE; Schema: auth_schema; Owner: rebloom
--

CREATE TYPE auth_schema.user_role AS ENUM (
    'CHILDREN',
    'PARENT',
    'COUNSELOR'
);


ALTER TYPE auth_schema.user_role OWNER TO rebloom;

--
-- Name: user_status; Type: TYPE; Schema: auth_schema; Owner: rebloom
--

CREATE TYPE auth_schema.user_status AS ENUM (
    'ACTIVE',
    'WITHDRAW'
);


ALTER TYPE auth_schema.user_status OWNER TO rebloom;

--
-- Name: gender; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.gender AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public.gender OWNER TO rebloom;

--
-- Name: relation_status; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.relation_status AS ENUM (
    'ACTIVE',
    'PENDING',
    'REJECT'
);


ALTER TYPE public.relation_status OWNER TO rebloom;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.user_role AS ENUM (
    'CHILD',
    'PARENT',
    'COUNSELOR'
);


ALTER TYPE public.user_role OWNER TO rebloom;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'WITHDRAW'
);


ALTER TYPE public.user_status OWNER TO rebloom;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: children_counselor_relations; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.children_counselor_relations (
    id bigint NOT NULL,
    counselor_id uuid NOT NULL,
    children_id uuid NOT NULL,
    started_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone,
    relation_status auth_schema.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE auth_schema.children_counselor_relations OWNER TO rebloom;

--
-- Name: children_counselor_relations_id_seq; Type: SEQUENCE; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE auth_schema.children_counselor_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME auth_schema.children_counselor_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: children_parent_relations; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.children_parent_relations (
    id bigint NOT NULL,
    relation_status auth_schema.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    children_id uuid NOT NULL,
    parent_id uuid NOT NULL
);


ALTER TABLE auth_schema.children_parent_relations OWNER TO rebloom;

--
-- Name: children_parent_relations_id_seq; Type: SEQUENCE; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE auth_schema.children_parent_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME auth_schema.children_parent_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: childrens; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.childrens (
    id uuid NOT NULL,
    birth character varying NOT NULL,
    gender auth_schema.gender NOT NULL,
    address character varying NOT NULL,
    address_detail character varying NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7)
);


ALTER TABLE auth_schema.childrens OWNER TO rebloom;

--
-- Name: counselors; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.counselors (
    id uuid NOT NULL,
    hospital_name character varying NOT NULL,
    hospital_address character varying NOT NULL,
    hospital_address_detail character varying NOT NULL,
    phone character varying NOT NULL
);


ALTER TABLE auth_schema.counselors OWNER TO rebloom;

--
-- Name: devices; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.devices (
    serial_number character varying NOT NULL,
    id bigint NOT NULL,
    device_type character varying NOT NULL,
    children_id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE auth_schema.devices OWNER TO rebloom;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE auth_schema.devices ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME auth_schema.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE auth_schema.flyway_schema_history OWNER TO rebloom;

--
-- Name: parent_counselor_relations; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.parent_counselor_relations (
    id bigint NOT NULL,
    started_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone NOT NULL,
    relation_status auth_schema.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    counselor_id uuid NOT NULL,
    parent_id uuid NOT NULL
);


ALTER TABLE auth_schema.parent_counselor_relations OWNER TO rebloom;

--
-- Name: parent_counselor_relations_id_seq; Type: SEQUENCE; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE auth_schema.parent_counselor_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME auth_schema.parent_counselor_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: parents; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.parents (
    id uuid NOT NULL
);


ALTER TABLE auth_schema.parents OWNER TO rebloom;

--
-- Name: social_users; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.social_users (
    id uuid NOT NULL,
    provider character varying NOT NULL,
    provider_user_id character varying NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE auth_schema.social_users OWNER TO rebloom;

--
-- Name: users; Type: TABLE; Schema: auth_schema; Owner: rebloom
--

CREATE TABLE auth_schema.users (
    id uuid NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    role auth_schema.user_role NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    status auth_schema.user_status NOT NULL
);


ALTER TABLE auth_schema.users OWNER TO rebloom;

--
-- Name: children_counselor_relations; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.children_counselor_relations (
    id bigint NOT NULL,
    counselor_id uuid NOT NULL,
    children_id uuid NOT NULL,
    started_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone,
    relation_status public.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE public.children_counselor_relations OWNER TO rebloom;

--
-- Name: children_counselor_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.children_counselor_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.children_counselor_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: children_parent_relations; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.children_parent_relations (
    id bigint NOT NULL,
    relation_status public.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    children_id uuid NOT NULL,
    parent_id uuid NOT NULL
);


ALTER TABLE public.children_parent_relations OWNER TO rebloom;

--
-- Name: children_parent_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.children_parent_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.children_parent_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: childrens; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.childrens (
    id uuid NOT NULL,
    birth character varying NOT NULL,
    gender public.gender NOT NULL,
    address character varying NOT NULL,
    address_detail character varying NOT NULL
);


ALTER TABLE public.childrens OWNER TO rebloom;

--
-- Name: counselors; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.counselors (
    id uuid NOT NULL,
    hospital_name character varying NOT NULL,
    hospital_address character varying NOT NULL
);


ALTER TABLE public.counselors OWNER TO rebloom;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.devices (
    serial_number character varying NOT NULL,
    paired_at timestamp without time zone NOT NULL,
    is_paired boolean NOT NULL,
    parent_id uuid NOT NULL,
    id bigint NOT NULL
);


ALTER TABLE public.devices OWNER TO rebloom;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.devices ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO rebloom;

--
-- Name: parent_counselor_relations; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.parent_counselor_relations (
    id bigint NOT NULL,
    started_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone NOT NULL,
    relation_status public.relation_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    counselor_id uuid NOT NULL,
    parent_id uuid NOT NULL
);


ALTER TABLE public.parent_counselor_relations OWNER TO rebloom;

--
-- Name: parent_counselor_relations_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.parent_counselor_relations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.parent_counselor_relations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: parents; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.parents (
    id uuid NOT NULL,
    code character varying NOT NULL
);


ALTER TABLE public.parents OWNER TO rebloom;

--
-- Name: social_users; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.social_users (
    id uuid NOT NULL,
    provider character varying NOT NULL,
    provider_user_id character varying NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.social_users OWNER TO rebloom;

--
-- Name: users; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying NOT NULL,
    password character varying NOT NULL,
    name character varying NOT NULL,
    phone character varying NOT NULL,
    role public.user_role NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    status public.user_status NOT NULL
);


ALTER TABLE public.users OWNER TO rebloom;

--
-- Data for Name: children_counselor_relations; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.children_counselor_relations (id, counselor_id, children_id, started_at, ended_at, relation_status, created_at, modified_at) FROM stdin;
1	63000000-0000-0000-0000-000000000003	61000000-0000-0000-0000-000000000003	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
2	63000000-0000-0000-0000-000000000002	61000000-0000-0000-0000-000000000002	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
3	63000000-0000-0000-0000-000000000001	61000000-0000-0000-0000-000000000001	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
5	63000000-0000-0000-0000-000000000006	61000000-0000-0000-0000-000000000006	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
6	63000000-0000-0000-0000-000000000004	61000000-0000-0000-0000-000000000004	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
7	63000000-0000-0000-0000-000000000005	61000000-0000-0000-0000-000000000005	2026-05-14 15:40:56.709035	\N	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035
\.


--
-- Data for Name: children_parent_relations; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.children_parent_relations (id, relation_status, created_at, modified_at, children_id, parent_id) FROM stdin;
1	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001
2	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000002	62000000-0000-0000-0000-000000000002
3	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003
5	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000004	62000000-0000-0000-0000-000000000004
6	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000005	62000000-0000-0000-0000-000000000005
7	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	61000000-0000-0000-0000-000000000006	62000000-0000-0000-0000-000000000006
\.


--
-- Data for Name: childrens; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.childrens (id, birth, gender, address, address_detail, latitude, longitude) FROM stdin;
61000000-0000-0000-0000-000000000001	2015-01-01	MALE	Seoul Gangnam Teheran-ro 212	101	37.5012743	127.0395850
61000000-0000-0000-0000-000000000002	2016-02-02	FEMALE	Seoul Songpa Olympic-ro 300	202	37.5132612	127.1001336
61000000-0000-0000-0000-000000000003	2017-03-03	MALE	Seoul Mapo Worldcup-ro 396	303	37.5796170	126.8904040
61000000-0000-0000-0000-000000000004	2015-04-04	FEMALE	Seoul Seocho Seocho-daero 77	404	37.4837121	127.0324112
61000000-0000-0000-0000-000000000005	2016-05-05	MALE	Seoul Yongsan Hangang-daero 405	505	37.5546788	126.9706069
61000000-0000-0000-0000-000000000006	2017-06-06	FEMALE	Seoul Seongdong Wangsimni-ro 222	606	37.5615335	127.0377320
\.


--
-- Data for Name: counselors; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.counselors (id, hospital_name, hospital_address, hospital_address_detail, phone) FROM stdin;
63000000-0000-0000-0000-000000000002	ReBloom Mind Clinic Two	Seoul Gangnam Teheran-ro 428	2F	010-1000-0002
63000000-0000-0000-0000-000000000003	ReBloom Mind Clinic Three	Seoul Gangnam Teheran-ro 428	3F	010-1000-0003
63000000-0000-0000-0000-000000000004	ReBloom Mind Clinic Four	Seoul Gangnam Teheran-ro 428	4F	010-1000-0004
63000000-0000-0000-0000-000000000005	ReBloom Mind Clinic Five	Seoul Gangnam Teheran-ro 428	5F	010-1000-0005
63000000-0000-0000-0000-000000000006	ReBloom Mind Clinic Six	Seoul Gangnam Teheran-ro 428	6F	010-1000-0006
63000000-0000-0000-0000-000000000001	ReBloom Mind Clinic One	Seoul Gangnam Teheran-ro 428	1F	010-1000-0123
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.devices (serial_number, id, device_type, children_id, created_at, modified_at) FROM stdin;
0000fe10-0000-1000-8000-00805f9b34fb	10	IOT	61000000-0000-0000-0000-000000000003	2026-05-18 23:03:13.810166	2026-05-18 23:03:13.810166
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
0	\N	<< Flyway Schema Creation >>	SCHEMA	"auth_schema"	\N	rebloom	2026-05-15 12:51:11.511159	0	t
1	1	init auth schema	SQL	V1__init_auth_schema.sql	717648276	rebloom	2026-05-15 12:51:11.553332	155	t
2	1.1	auth schema	SQL	V1.1__auth_schema.sql	1199866593	rebloom	2026-05-15 12:51:11.797789	36	t
3	1.2	auth schema	SQL	V1.2__auth_schema.sql	-1892638795	rebloom	2026-05-15 12:51:11.862923	11	t
4	1.3	children counselor relations	SQL	V1.3__children_counselor_relations.sql	1531947919	rebloom	2026-05-15 12:51:11.906187	28	t
5	1.4	auth schema	SQL	V1.4__auth_schema.sql	-157127325	rebloom	2026-05-15 12:51:11.960265	33	t
6	2	counselor add columns	SQL	V2__counselor_add_columns.sql	-1318290707	rebloom	2026-05-15 12:51:12.010979	12	t
7	2.1	phone column move to counselor	SQL	V2.1__phone_column_move_to_counselor.sql	587527774	rebloom	2026-05-15 12:51:12.039768	11	t
8	2.3	children location columns	SQL	V2.3__children_location_columns.sql	1398886282	rebloom	2026-05-15 12:51:12.065061	8	t
9	2.4	device child mapping	SQL	V2.4__device_child_mapping.sql	-726304355	rebloom	2026-05-15 12:51:12.083843	50	t
10	2.5	drop parent counselor code columns	SQL	V2.5__drop_parent_counselor_code_columns.sql	1746283489	rebloom	2026-05-15 12:51:12.172235	7	t
11	2.6	devices time columns	SQL	V2.6__devices_time_columns.sql	2107771989	rebloom	2026-05-17 15:25:00.417813	131	t
\.


--
-- Data for Name: parent_counselor_relations; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.parent_counselor_relations (id, started_at, ended_at, relation_status, created_at, modified_at, counselor_id, parent_id) FROM stdin;
1	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000002	62000000-0000-0000-0000-000000000002
2	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001
3	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003
5	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000004	62000000-0000-0000-0000-000000000004
6	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000005	62000000-0000-0000-0000-000000000005
7	2026-05-14 15:40:56.709035	2038-01-19 03:14:07	ACTIVE	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	63000000-0000-0000-0000-000000000006	62000000-0000-0000-0000-000000000006
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.parents (id) FROM stdin;
62000000-0000-0000-0000-000000000001
62000000-0000-0000-0000-000000000002
62000000-0000-0000-0000-000000000003
62000000-0000-0000-0000-000000000004
62000000-0000-0000-0000-000000000005
62000000-0000-0000-0000-000000000006
\.


--
-- Data for Name: social_users; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.social_users (id, provider, provider_user_id, user_id) FROM stdin;
b3e23305-62dc-4f56-8763-f797d8e0c093	google	117888121261213382304	72176dc9-1f65-43d9-b4d4-ff2180641387
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth_schema; Owner: rebloom
--

COPY auth_schema.users (id, email, password, name, role, created_at, modified_at, status) FROM stdin;
61000000-0000-0000-0000-000000000001	child1@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Child One	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
61000000-0000-0000-0000-000000000002	child2@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Child Two	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
61000000-0000-0000-0000-000000000004	child4@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Child Four	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
61000000-0000-0000-0000-000000000005	child5@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Child Five	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
61000000-0000-0000-0000-000000000006	child6@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Child Six	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000001	parent1@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Parent One	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000002	parent2@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Parent Two	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000004	parent4@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Parent Four	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000005	parent5@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Parent Five	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000006	parent6@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Parent Six	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
63000000-0000-0000-0000-000000000001	counselor1@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Counselor One	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-19 03:18:17.915598	ACTIVE
63000000-0000-0000-0000-000000000002	counselor2@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Counselor Two	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
63000000-0000-0000-0000-000000000004	counselor4@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Counselor Four	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
63000000-0000-0000-0000-000000000005	counselor5@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Counselor Five	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
63000000-0000-0000-0000-000000000006	counselor6@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	Counselor Six	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
fa67e8fe-9b74-4bcf-ad2f-173af7952455	katiegood1426@gmail.com	$2a$10$a..NAo8mEcev7JPpk9bwPO6x979bLe7wH7Epe5R8VcqYSnEbSAQ4y	김서현	PARENT	2026-05-17 14:59:40.689877	2026-05-17 14:59:40.689877	ACTIVE
bac71d57-f908-4d8a-9a7a-e1a0c71a55c9	katie1426@naver.com	$2a$10$bA7oblE/IvKKe8GPmIpzIelRVKWV1pvNucjpa5eCie2i.TUGu0/vG	김서현	CHILDREN	2026-05-17 15:00:59.110534	2026-05-17 15:00:59.110534	ACTIVE
584ffdd3-7327-4451-9fb6-90a8989edd41	asekf100@naver.com	$2a$10$Egc2TcuQZEKoRGwOMBE5h.ANJ0aYJqeP0xwmkmv/u7wvoHmOvnBtK	유주경	PARENT	2026-05-17 20:19:47.395513	2026-05-17 20:19:47.395513	ACTIVE
8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	asekf122@gmail.com	$2a$10$oafVEdQuW7lvavvzVdczCeKEXDOODKIzm5JQoX2Fal/AJKeP9ngWm	유주성	CHILDREN	2026-05-17 20:27:39.571334	2026-05-17 20:27:39.571334	ACTIVE
72176dc9-1f65-43d9-b4d4-ff2180641387	lwh4coach@gmail.com	$2a$10$OnN4PKLC9GTC2e70krPJlOZ1w.2AipLfTFIr8GteEFwCLseKh3Xdy	이웅희	COUNSELOR	2026-05-18 08:57:26.239792	2026-05-18 08:57:26.239792	ACTIVE
63000000-0000-0000-0000-000000000003	counselor3@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	마동석	COUNSELOR	2026-05-14 15:40:56.709035	2026-05-19 21:47:14.115938	ACTIVE
61000000-0000-0000-0000-000000000003	child3@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	유주경	CHILDREN	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
62000000-0000-0000-0000-000000000003	parent3@a.a	$2b$10$xD5FWjonb5F/YJB04.hOk.brG6lIVXD25z1CZTfU0kiAm.2LXW4hC	유승형	PARENT	2026-05-14 15:40:56.709035	2026-05-14 15:40:56.709035	ACTIVE
\.


--
-- Data for Name: children_counselor_relations; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.children_counselor_relations (id, counselor_id, children_id, started_at, ended_at, relation_status, created_at, modified_at) FROM stdin;
\.


--
-- Data for Name: children_parent_relations; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.children_parent_relations (id, relation_status, created_at, modified_at, children_id, parent_id) FROM stdin;
\.


--
-- Data for Name: childrens; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.childrens (id, birth, gender, address, address_detail) FROM stdin;
\.


--
-- Data for Name: counselors; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.counselors (id, hospital_name, hospital_address) FROM stdin;
\.


--
-- Data for Name: devices; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.devices (serial_number, paired_at, is_paired, parent_id, id) FROM stdin;
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init auth schema	SQL	V1__init_auth_schema.sql	717648276	rebloom	2026-05-19 14:32:52.086952	666	t
2	1.1	auth schema	SQL	V1.1__auth_schema.sql	1199866593	rebloom	2026-05-19 14:32:52.911282	57	t
3	1.2	auth schema	SQL	V1.2__auth_schema.sql	-1892638795	rebloom	2026-05-19 14:32:53.045848	46	t
4	1.3	children counselor relations	SQL	V1.3__children_counselor_relations.sql	1531947919	rebloom	2026-05-19 14:32:53.124866	104	t
5	1.4	auth schema	SQL	V1.4__auth_schema.sql	-157127325	rebloom	2026-05-19 14:32:53.272924	112	t
\.


--
-- Data for Name: parent_counselor_relations; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.parent_counselor_relations (id, started_at, ended_at, relation_status, created_at, modified_at, counselor_id, parent_id) FROM stdin;
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.parents (id, code) FROM stdin;
\.


--
-- Data for Name: social_users; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.social_users (id, provider, provider_user_id, user_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.users (id, email, password, name, phone, role, created_at, modified_at, status) FROM stdin;
\.


--
-- Name: children_counselor_relations_id_seq; Type: SEQUENCE SET; Schema: auth_schema; Owner: rebloom
--

SELECT pg_catalog.setval('auth_schema.children_counselor_relations_id_seq', 7, true);


--
-- Name: children_parent_relations_id_seq; Type: SEQUENCE SET; Schema: auth_schema; Owner: rebloom
--

SELECT pg_catalog.setval('auth_schema.children_parent_relations_id_seq', 9, true);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: auth_schema; Owner: rebloom
--

SELECT pg_catalog.setval('auth_schema.devices_id_seq', 10, true);


--
-- Name: parent_counselor_relations_id_seq; Type: SEQUENCE SET; Schema: auth_schema; Owner: rebloom
--

SELECT pg_catalog.setval('auth_schema.parent_counselor_relations_id_seq', 7, true);


--
-- Name: children_counselor_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.children_counselor_relations_id_seq', 1, false);


--
-- Name: children_parent_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.children_parent_relations_id_seq', 1, false);


--
-- Name: devices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.devices_id_seq', 1, false);


--
-- Name: parent_counselor_relations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.parent_counselor_relations_id_seq', 1, false);


--
-- Name: children_counselor_relations children_counselor_relations_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_counselor_relations
    ADD CONSTRAINT children_counselor_relations_pkey PRIMARY KEY (id);


--
-- Name: children_parent_relations children_parent_relations_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_parent_relations
    ADD CONSTRAINT children_parent_relations_pkey PRIMARY KEY (id);


--
-- Name: childrens childrens_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.childrens
    ADD CONSTRAINT childrens_pkey PRIMARY KEY (id);


--
-- Name: counselors counselors_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.counselors
    ADD CONSTRAINT counselors_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: parent_counselor_relations parent_counselor_relations_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.parent_counselor_relations
    ADD CONSTRAINT parent_counselor_relations_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: social_users social_users_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.social_users
    ADD CONSTRAINT social_users_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: children_counselor_relations children_counselor_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_counselor_relations
    ADD CONSTRAINT children_counselor_relations_pkey PRIMARY KEY (id);


--
-- Name: children_parent_relations children_parent_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_parent_relations
    ADD CONSTRAINT children_parent_relations_pkey PRIMARY KEY (id);


--
-- Name: childrens childrens_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.childrens
    ADD CONSTRAINT childrens_pkey PRIMARY KEY (id);


--
-- Name: counselors counselors_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.counselors
    ADD CONSTRAINT counselors_pkey PRIMARY KEY (id);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: parent_counselor_relations parent_counselor_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.parent_counselor_relations
    ADD CONSTRAINT parent_counselor_relations_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: social_users social_users_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.social_users
    ADD CONSTRAINT social_users_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE INDEX flyway_schema_history_s_idx ON auth_schema.flyway_schema_history USING btree (success);


--
-- Name: idx_children_counselor_relations_children; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE INDEX idx_children_counselor_relations_children ON auth_schema.children_counselor_relations USING btree (children_id);


--
-- Name: idx_children_counselor_relations_counselor_children; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE INDEX idx_children_counselor_relations_counselor_children ON auth_schema.children_counselor_relations USING btree (counselor_id, children_id);


--
-- Name: uq_active_children_counselor_relation; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE UNIQUE INDEX uq_active_children_counselor_relation ON auth_schema.children_counselor_relations USING btree (counselor_id, children_id) WHERE (ended_at IS NULL);


--
-- Name: uq_devices_children_device_type; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE UNIQUE INDEX uq_devices_children_device_type ON auth_schema.devices USING btree (children_id, device_type);


--
-- Name: uq_devices_serial_number; Type: INDEX; Schema: auth_schema; Owner: rebloom
--

CREATE UNIQUE INDEX uq_devices_serial_number ON auth_schema.devices USING btree (serial_number);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_children_counselor_relations_children; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_children_counselor_relations_children ON public.children_counselor_relations USING btree (children_id);


--
-- Name: idx_children_counselor_relations_counselor_children; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_children_counselor_relations_counselor_children ON public.children_counselor_relations USING btree (counselor_id, children_id);


--
-- Name: uq_active_children_counselor_relation; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE UNIQUE INDEX uq_active_children_counselor_relation ON public.children_counselor_relations USING btree (counselor_id, children_id) WHERE (ended_at IS NULL);


--
-- Name: children_counselor_relations fk_children_counselor_children; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_counselor_relations
    ADD CONSTRAINT fk_children_counselor_children FOREIGN KEY (children_id) REFERENCES auth_schema.childrens(id);


--
-- Name: children_counselor_relations fk_children_counselor_counselor; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_counselor_relations
    ADD CONSTRAINT fk_children_counselor_counselor FOREIGN KEY (counselor_id) REFERENCES auth_schema.counselors(id);


--
-- Name: children_parent_relations fk_children_parent_child; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_parent_relations
    ADD CONSTRAINT fk_children_parent_child FOREIGN KEY (children_id) REFERENCES auth_schema.childrens(id);


--
-- Name: children_parent_relations fk_children_parent_parent; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.children_parent_relations
    ADD CONSTRAINT fk_children_parent_parent FOREIGN KEY (parent_id) REFERENCES auth_schema.parents(id);


--
-- Name: childrens fk_childrens_user; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.childrens
    ADD CONSTRAINT fk_childrens_user FOREIGN KEY (id) REFERENCES auth_schema.users(id);


--
-- Name: counselors fk_counselors_user; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.counselors
    ADD CONSTRAINT fk_counselors_user FOREIGN KEY (id) REFERENCES auth_schema.users(id);


--
-- Name: devices fk_devices_children; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.devices
    ADD CONSTRAINT fk_devices_children FOREIGN KEY (children_id) REFERENCES auth_schema.childrens(id);


--
-- Name: parent_counselor_relations fk_parent_counselor_counselor; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.parent_counselor_relations
    ADD CONSTRAINT fk_parent_counselor_counselor FOREIGN KEY (counselor_id) REFERENCES auth_schema.counselors(id);


--
-- Name: parent_counselor_relations fk_parent_counselor_parent; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.parent_counselor_relations
    ADD CONSTRAINT fk_parent_counselor_parent FOREIGN KEY (parent_id) REFERENCES auth_schema.parents(id);


--
-- Name: parents fk_parents_user; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.parents
    ADD CONSTRAINT fk_parents_user FOREIGN KEY (id) REFERENCES auth_schema.users(id);


--
-- Name: social_users fk_social_users_user; Type: FK CONSTRAINT; Schema: auth_schema; Owner: rebloom
--

ALTER TABLE ONLY auth_schema.social_users
    ADD CONSTRAINT fk_social_users_user FOREIGN KEY (user_id) REFERENCES auth_schema.users(id);


--
-- Name: children_counselor_relations fk_children_counselor_children; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_counselor_relations
    ADD CONSTRAINT fk_children_counselor_children FOREIGN KEY (children_id) REFERENCES public.childrens(id);


--
-- Name: children_counselor_relations fk_children_counselor_counselor; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_counselor_relations
    ADD CONSTRAINT fk_children_counselor_counselor FOREIGN KEY (counselor_id) REFERENCES public.counselors(id);


--
-- Name: children_parent_relations fk_children_parent_child; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_parent_relations
    ADD CONSTRAINT fk_children_parent_child FOREIGN KEY (children_id) REFERENCES public.childrens(id);


--
-- Name: children_parent_relations fk_children_parent_parent; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_parent_relations
    ADD CONSTRAINT fk_children_parent_parent FOREIGN KEY (parent_id) REFERENCES public.parents(id);


--
-- Name: childrens fk_childrens_user; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.childrens
    ADD CONSTRAINT fk_childrens_user FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: counselors fk_counselors_user; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.counselors
    ADD CONSTRAINT fk_counselors_user FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: devices fk_devices_parent; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT fk_devices_parent FOREIGN KEY (parent_id) REFERENCES public.parents(id);


--
-- Name: parent_counselor_relations fk_parent_counselor_counselor; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.parent_counselor_relations
    ADD CONSTRAINT fk_parent_counselor_counselor FOREIGN KEY (counselor_id) REFERENCES public.counselors(id);


--
-- Name: parent_counselor_relations fk_parent_counselor_parent; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.parent_counselor_relations
    ADD CONSTRAINT fk_parent_counselor_parent FOREIGN KEY (parent_id) REFERENCES public.parents(id);


--
-- Name: parents fk_parents_user; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT fk_parents_user FOREIGN KEY (id) REFERENCES public.users(id);


--
-- Name: social_users fk_social_users_user; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.social_users
    ADD CONSTRAINT fk_social_users_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2FLc0rGGANV3F7ydbNsgxq9roYTYfdULgJjSzK9vS6IyLDpndDBTsKZ2Mfyp2HF

--
-- Database "rebloom_biometric" dump
--

--
-- PostgreSQL database dump
--

\restrict 5ObXdNpeGKstEBdQelj5WNaklRjJCq1bSSlkNuoa9ILRQbKie3gyfXOB6ncSAbH

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rebloom_biometric; Type: DATABASE; Schema: -; Owner: rebloom
--

CREATE DATABASE rebloom_biometric WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rebloom_biometric OWNER TO rebloom;

\unrestrict 5ObXdNpeGKstEBdQelj5WNaklRjJCq1bSSlkNuoa9ILRQbKie3gyfXOB6ncSAbH
\connect rebloom_biometric
\restrict 5ObXdNpeGKstEBdQelj5WNaklRjJCq1bSSlkNuoa9ILRQbKie3gyfXOB6ncSAbH

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: anomalies; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.anomalies (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    ts_start timestamp without time zone NOT NULL,
    ts_end timestamp without time zone NOT NULL,
    hr double precision,
    rmssd double precision,
    pnn50 double precision,
    lf_hf double precision,
    acc_mag double precision,
    hr_acc_ratio double precision,
    is_anomaly boolean
);


ALTER TABLE public.anomalies OWNER TO rebloom;

--
-- Name: anomalies_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.anomalies ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.anomalies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: biometrics; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.biometrics (
    user_id uuid NOT NULL,
    ts_start timestamp without time zone NOT NULL,
    ts_end timestamp without time zone NOT NULL,
    hr double precision,
    ibi double precision,
    rmssd double precision,
    pnn50 double precision,
    lf_hf double precision,
    acc_x_avg double precision,
    acc_y_avg double precision,
    acc_z_avg double precision,
    acc_mag double precision,
    hr_acc_ratio double precision,
    missingness_score double precision
);


ALTER TABLE public.biometrics OWNER TO rebloom;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO rebloom;

--
-- Name: phq_results; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.phq_results (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    result smallint NOT NULL,
    score double precision NOT NULL,
    predicted_at timestamp without time zone NOT NULL
);


ALTER TABLE public.phq_results OWNER TO rebloom;

--
-- Name: phq_results_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.phq_results ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.phq_results_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sleeps; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.sleeps (
    user_id uuid NOT NULL,
    asleep timestamp without time zone NOT NULL,
    wakeup timestamp without time zone NOT NULL,
    sleep_duration double precision,
    waso double precision,
    sleep_score double precision,
    sleep_efficiency double precision,
    is_main_sleep boolean
);


ALTER TABLE public.sleeps OWNER TO rebloom;

--
-- Data for Name: anomalies; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.anomalies (id, user_id, ts_start, ts_end, hr, rmssd, pnn50, lf_hf, acc_mag, hr_acc_ratio, is_anomaly) FROM stdin;
1	61000000-0000-0000-0000-000000000001	2026-05-07 08:05:00	2026-05-07 08:10:00	96	24.7	8.1	2.3	1.21	79.3	t
2	61000000-0000-0000-0000-000000000002	2026-05-07 08:05:00	2026-05-07 08:10:00	80	40	17	1.28	1	80	f
3	61000000-0000-0000-0000-000000000003	2026-05-07 08:05:00	2026-05-07 08:10:00	92	29.4	10.3	1.95	1.11	82.8	\N
4	61000000-0000-0000-0000-000000000001	2026-05-18 16:00:00	2026-05-18 16:05:00	180	5	80	6	25	80	t
5	61000000-0000-0000-0000-000000000002	2026-05-18 16:20:00	2026-05-18 16:25:00	180	5	80	6	25	80	t
6	61000000-0000-0000-0000-000000000003	2026-05-18 15:55:00	2026-05-18 16:00:00	180	5	80	6	25	80	t
7	61000000-0000-0000-0000-000000000001	2026-05-18 20:25:00	2026-05-18 20:30:00	180	5	80	6	25	80	t
8	61000000-0000-0000-0000-000000000001	2026-05-18 20:25:00	2026-05-18 20:30:00	72	42	22	1.8	9.8	7.35	f
9	61000000-0000-0000-0000-000000000003	2026-05-18 16:00:00	2026-05-18 16:05:00	180	5	80	6	25	80	t
10	61000000-0000-0000-0000-000000000003	2026-05-18 16:05:00	2026-05-18 16:10:00	180	5	80	6	25	80	t
11	61000000-0000-0000-0000-000000000003	2026-05-18 16:10:00	2026-05-18 16:15:00	180	5	80	6	25	80	t
12	61000000-0000-0000-0000-000000000001	2026-05-18 20:55:00	2026-05-18 21:00:00	155	4	0.5	8.5	1.2	129.2	t
13	61000000-0000-0000-0000-000000000006	2026-05-18 22:51:32	2026-05-18 22:58:00	75.13207	99.30844	0.40243903	1.0646659	231.33365	0.32477796	t
14	61000000-0000-0000-0000-000000000006	2026-05-18 22:58:02	2026-05-18 23:03:18	76.398735	212.95636	0.556391	0.8957836	331.187	0.23068155	t
15	61000000-0000-0000-0000-000000000003	2026-05-18 16:15:00	2026-05-18 16:20:00	180	5	80	6	25	80	t
16	61000000-0000-0000-0000-000000000006	2026-05-18 23:03:18	2026-05-18 23:10:20	82.70053	168.91805	0.62015504	0.87350345	759.3208	0.108913824	t
17	61000000-0000-0000-0000-000000000006	2026-05-18 23:10:21	2026-05-18 23:18:32	74.86777	140.9644	0.52380955	0.9448407	320.61765	0.23351106	t
18	61000000-0000-0000-0000-000000000001	2026-05-18 23:31:26	2026-05-18 23:37:13	73.23735	121.010826	0.4550898	0.9289676	216.71085	0.33794963	f
19	61000000-0000-0000-0000-000000000006	2026-05-18 23:37:13	2026-05-18 23:48:06	73.984375	175.42387	0.5185185	2.9076746	340.39832	0.21734647	t
20	61000000-0000-0000-0000-000000000006	2026-05-18 23:48:06	2026-05-18 23:54:30	72.611115	104.90015	0.47978437	0.90199214	243.44756	0.29826182	t
21	61000000-0000-0000-0000-000000000006	2026-05-18 23:54:30	2026-05-19 00:00:08	71.873344	142.01268	0.5052265	1.2535018	588.73315	0.12208136	t
22	61000000-0000-0000-0000-000000000006	2026-05-19 00:00:08	2026-05-19 00:10:16	71.749344	161.97617	0.5992714	1.1800119	917.00214	0.078243375	t
23	61000000-0000-0000-0000-000000000003	2026-05-18 16:20:00	2026-05-18 16:25:00	180	5	80	6	25	80	t
24	61000000-0000-0000-0000-000000000003	2026-05-18 16:25:00	2026-05-18 16:30:00	180	5	80	6	25	80	t
25	61000000-0000-0000-0000-000000000003	2026-05-18 16:30:00	2026-05-18 16:35:00	180	5	80	6	25	80	t
26	61000000-0000-0000-0000-000000000003	2026-05-18 16:35:00	2026-05-18 16:40:00	180	5	80	6	25	80	t
27	61000000-0000-0000-0000-000000000001	2026-05-19 00:41:26	2026-05-19 00:47:20	67.863205	197.24942	0.5859375	1.0043322	282.4455	0.2402701	f
28	61000000-0000-0000-0000-000000000001	2026-05-19 00:47:20	2026-05-19 00:52:52	64.636055	112.414024	0.5919003	1.4322509	147.28209	0.4388589	f
29	61000000-0000-0000-0000-000000000003	2026-05-19 00:52:53	2026-05-19 01:07:31	67.45399	176.34756	0.5194085	0.6306649	533.94226	0.12633198	t
30	61000000-0000-0000-0000-000000000003	2026-05-19 01:07:31	2026-05-19 01:21:19	68.048935	129	1	-1	249.81213	0.27240044	t
31	61000000-0000-0000-0000-000000000006	2026-05-19 01:42:54	2026-05-19 01:48:04	68.35235	150.73187	0.52040815	0.6817765	9.738286	6.365294	t
32	61000000-0000-0000-0000-000000000006	2026-05-19 01:48:05	2026-05-19 01:55:00	67.29578	148.67728	0.48232323	0.7138509	9.808655	6.226101	t
33	61000000-0000-0000-0000-000000000006	2026-05-19 01:55:00	2026-05-19 02:04:16	68.41011	144.04297	0.475	0.94677955	9.806254	6.3306036	t
34	61000000-0000-0000-0000-000000000006	2026-05-19 02:04:16	2026-05-19 02:09:48	70.361115	223.81445	0.56953645	1.1869214	9.933184	6.435556	t
35	61000000-0000-0000-0000-000000000006	2026-05-19 02:09:48	2026-05-19 02:15:00	74.49231	182.32707	0.629771	0.8983349	9.916162	6.824039	t
36	61000000-0000-0000-0000-000000000006	2026-05-19 02:41:23	2026-05-19 02:46:56	66.296425	203.1975	0.71659917	0.56773	9.80984	6.13297	t
37	61000000-0000-0000-0000-000000000006	2026-05-19 02:46:56	2026-05-19 02:51:56	87.42548	156.3879	0.4918033	0.73375154	11.84861	6.8042755	t
38	61000000-0000-0000-0000-000000000006	2026-05-19 02:51:57	2026-05-19 02:57:17	70.90164	101.50823	0.47058824	0.7777972	9.878193	6.5177774	t
39	61000000-0000-0000-0000-000000000006	2026-05-19 02:57:17	2026-05-19 03:06:33	77.58021	99.85398	0.39375	0.9000754	9.830669	7.1630116	f
40	61000000-0000-0000-0000-000000000006	2026-05-19 03:14:59	2026-05-19 03:20:34	76.0054	82.68751	0.24873096	0.92922795	9.847665	7.006614	f
41	61000000-0000-0000-0000-000000000006	2026-05-19 03:20:34	2026-05-19 03:27:19	78.554794	104.95296	0.38256657	0.8008824	9.820429	7.2598596	f
42	61000000-0000-0000-0000-000000000006	2026-05-19 03:27:19	2026-05-19 03:35:00	73.024025	109.585625	0.40039062	0.73659486	9.814162	6.752629	f
43	61000000-0000-0000-0000-000000000006	2026-05-19 03:35:00	2026-05-19 03:41:37	74.79074	146.10516	0.6097561	0.9461415	9.923324	6.846885	f
44	61000000-0000-0000-0000-000000000006	2026-05-19 04:39:02	2026-05-19 04:44:03	71.125404	225.54356	0.62931037	0.6648601	9.863756	6.547036	f
45	61000000-0000-0000-0000-000000000006	2026-05-19 04:44:04	2026-05-19 04:54:07	71.42857	155.41066	0.49196786	1.5721267	9.8278885	6.596722	f
46	61000000-0000-0000-0000-000000000006	2026-05-19 04:54:07	2026-05-19 05:02:05	70.41418	104.78082	0.37945494	1.459125	9.801302	6.5190454	f
47	61000000-0000-0000-0000-000000000006	2026-05-19 09:54:53	2026-05-19 10:00:02	86.41428	143.05626	0.515625	0.4067177	9.738727	8.046977	f
48	61000000-0000-0000-0000-000000000006	2026-05-19 10:00:02	2026-05-19 10:05:32	86.74104	162.89664	0.4262295	1.7000872	9.759157	8.062067	f
49	61000000-0000-0000-0000-000000000006	2026-05-19 10:11:07	2026-05-19 10:16:45	82.95425	67.779236	0.25	0.17448254	9.697556	7.7545047	f
50	61000000-0000-0000-0000-000000000006	2026-05-19 10:16:45	2026-05-19 10:22:25	84.934715	149.78978	0.38968483	0.5139947	9.775972	7.8818607	f
51	61000000-0000-0000-0000-000000000006	2026-05-19 10:39:14	2026-05-19 10:44:52	79.62334	174.32675	0.59302324	0.7072154	9.914815	7.294978	f
52	61000000-0000-0000-0000-000000000006	2026-05-19 10:52:43	2026-05-19 10:59:50	78.34611	210.81146	0.575985	1.5179574	9.834389	7.231244	f
53	61000000-0000-0000-0000-000000000006	2026-05-19 11:07:25	2026-05-19 11:14:23	84.947365	174.35818	0.7777778	0.616	9.950313	7.757529	f
54	61000000-0000-0000-0000-000000000006	2026-05-19 11:14:23	2026-05-19 11:19:51	74.582855	132.29015	0.50282484	0.6879091	9.863238	6.865619	f
55	61000000-0000-0000-0000-000000000006	2026-05-19 11:19:51	2026-05-19 11:25:12	79.20488	137.49756	0.5102041	0.55090576	9.928122	7.2478037	f
56	61000000-0000-0000-0000-000000000006	2026-05-19 12:25:12	2026-05-19 12:30:21	82.542854	193	0.429	0.616	9.941696	7.543881	f
57	61000000-0000-0000-0000-000000000006	2026-05-19 12:30:21	2026-05-19 12:35:56	85.01967	154.43317	0.47902098	0.7331801	9.892181	7.8055687	f
58	61000000-0000-0000-0000-000000000006	2026-05-19 12:35:56	2026-05-19 12:41:16	85.3218	85.601234	0.2761905	0.5136411	9.85017	7.863637	f
59	61000000-0000-0000-0000-000000000006	2026-05-19 12:41:16	2026-05-19 12:46:51	82.30699	112.63865	0.32344213	1.3398573	9.906279	7.546753	f
60	61000000-0000-0000-0000-000000000006	2026-05-19 12:46:51	2026-05-19 12:52:24	85.61682	155.7313	0.42424244	1.0359756	9.88715	7.864025	f
61	61000000-0000-0000-0000-000000000006	2026-05-19 13:07:15	2026-05-19 13:14:43	82.54457	133.698	0.4016227	0.6641841	9.870896	7.5931706	f
62	61000000-0000-0000-0000-000000000006	2026-05-19 13:14:43	2026-05-19 13:20:50	81.47012	180.8938	0.57865167	1.4348717	9.921656	7.459503	f
63	61000000-0000-0000-0000-000000000006	2026-05-19 13:20:50	2026-05-19 13:28:06	83.00237	120.19555	0.33255813	0.6725194	10.020984	7.5313034	f
64	61000000-0000-0000-0000-000000000006	2026-05-19 13:28:06	2026-05-19 13:34:19	104.35507	306.56537	0.82978725	1.5612282	10.337199	9.20466	t
65	61000000-0000-0000-0000-000000000006	2026-05-19 13:34:19	2026-05-19 13:41:58	88.93171	0	0	0.616	9.792658	8.24002	f
66	61000000-0000-0000-0000-000000000003	2026-05-19 14:22:14	2026-05-19 14:30:03	82.612015	172.77586	0.5670103	0.88925195	9.635789	7.767361	f
67	61000000-0000-0000-0000-000000000003	2026-05-19 14:30:03	2026-05-19 14:36:25	80.12734	136.64569	0.550173	0.94161713	9.770796	7.439315	f
68	61000000-0000-0000-0000-000000000003	2026-05-19 14:35:00	2026-05-19 14:40:00	180	5	80	6	25	80	t
69	61000000-0000-0000-0000-000000000003	2026-05-19 14:40:00	2026-05-19 14:45:00	180	5	80	6	25	80	t
70	61000000-0000-0000-0000-000000000003	2026-05-19 14:45:00	2026-05-19 14:50:00	180	5	80	6	25	80	t
71	61000000-0000-0000-0000-000000000003	2026-05-19 14:50:00	2026-05-19 14:55:00	180	5	80	6	25	80	t
72	61000000-0000-0000-0000-000000000006	2026-05-19 18:38:03	2026-05-19 18:45:42	103	0	0	-1	9.915731	9.435923	f
73	61000000-0000-0000-0000-000000000006	2026-05-19 18:45:42	2026-05-19 18:53:43	65.50944	0	0	-1	9.645764	6.1535683	f
74	61000000-0000-0000-0000-000000000006	2026-05-19 18:53:43	2026-05-19 19:01:45	62.10386	64.13376	0.41618496	0.41332945	9.642533	5.8354397	f
75	61000000-0000-0000-0000-000000000006	2026-05-19 20:50:13	2026-05-19 20:57:38	72.7889	197.8846	0.66494846	0.7968074	9.823879	6.7248445	f
76	61000000-0000-0000-0000-000000000006	2026-05-19 20:57:38	2026-05-19 21:05:38	74.073944	196.89043	0.64777327	0.66001964	9.842321	6.831927	f
77	61000000-0000-0000-0000-000000000006	2026-05-19 21:05:38	2026-05-19 21:13:15	71.63934	163.77765	0.55333334	1.53378	9.901052	6.571782	f
78	61000000-0000-0000-0000-000000000006	2026-05-19 21:13:15	2026-05-19 21:20:47	78.38178	132.39162	0.46503496	0.8121682	9.690638	7.3318157	f
79	61000000-0000-0000-0000-000000000006	2026-05-19 21:52:29	2026-05-19 22:00:19	77.97685	120.44809	0.4766147	0.6175168	9.854575	7.1837773	f
80	61000000-0000-0000-0000-000000000006	2026-05-19 22:00:19	2026-05-19 22:07:55	78.121216	150.19522	0.52117264	1.0428969	9.867111	7.188775	f
81	61000000-0000-0000-0000-000000000006	2026-05-19 22:07:55	2026-05-19 22:15:30	78.24071	174.84583	0.6245353	1.7474827	9.85101	7.2104535	f
82	61000000-0000-0000-0000-000000000006	2026-05-19 22:15:30	2026-05-19 22:23:19	75.55454	114.83293	0.41734418	1.0647601	9.839149	6.9705234	f
83	61000000-0000-0000-0000-000000000006	2026-05-19 23:24:01	2026-05-19 23:30:27	78.85014	143.55882	0.55965906	1.0716478	10.062968	7.1273947	f
84	61000000-0000-0000-0000-000000000006	2026-05-19 23:30:27	2026-05-19 23:37:59	76.1242	123.073906	0.5029354	0.81962746	9.955512	6.948484	f
85	61000000-0000-0000-0000-000000000006	2026-05-19 23:37:59	2026-05-19 23:44:43	69.12363	121.23917	0.5652174	0.78646797	9.946685	6.314572	f
86	61000000-0000-0000-0000-000000000006	2026-05-19 23:44:43	2026-05-19 23:52:19	68.74354	105.50064	0.44271845	1.7932994	10.018542	6.238896	f
87	61000000-0000-0000-0000-000000000003	2026-05-20 15:45:00	2026-05-20 15:50:00	180	5	80	6	25	80	t
88	61000000-0000-0000-0000-000000000003	2026-05-20 15:50:00	2026-05-20 15:55:00	180	5	80	6	25	80	t
89	61000000-0000-0000-0000-000000000003	2026-05-20 15:55:00	2026-05-20 16:00:00	180	5	80	6	25	80	t
90	61000000-0000-0000-0000-000000000003	2026-05-20 16:00:00	2026-05-20 16:05:00	180	5	80	6	25	80	t
\.


--
-- Data for Name: biometrics; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.biometrics (user_id, ts_start, ts_end, hr, ibi, rmssd, pnn50, lf_hf, acc_x_avg, acc_y_avg, acc_z_avg, acc_mag, hr_acc_ratio, missingness_score) FROM stdin;
61000000-0000-0000-0000-000000000001	2026-05-07 08:00:00	2026-05-07 08:05:00	78	0.78	42.1	18.5	1.2	0.02	0.03	0.97	0.98	79.6	0.01
61000000-0000-0000-0000-000000000001	2026-05-07 08:05:00	2026-05-07 08:10:00	96	0.63	24.7	8.1	2.3	0.3	0.24	1.12	1.21	79.3	0.02
61000000-0000-0000-0000-000000000002	2026-05-07 08:00:00	2026-05-07 08:05:00	76	0.79	45	20	1.1	0.01	0.02	0.98	0.98	77.6	0
61000000-0000-0000-0000-000000000002	2026-05-07 08:05:00	2026-05-07 08:10:00	80	0.75	40	17	1.28	0.05	0.03	1	1	80	0.01
61000000-0000-0000-0000-000000000003	2026-05-07 08:00:00	2026-05-07 08:05:00	88	0.69	34.2	13.5	1.62	0.1	0.09	1.03	1.04	84.6	0.01
61000000-0000-0000-0000-000000000003	2026-05-07 08:05:00	2026-05-07 08:10:00	92	0.66	29.4	10.3	1.95	0.18	0.16	1.08	1.11	82.8	0.02
61000000-0000-0000-0000-000000000001	2026-05-16 20:00:00	2026-05-16 20:05:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:57:31	2026-05-18 13:01:43	89.32143	696.1146	165.19415	0.53571427	0.5041577	-442.2451	-1722.4634	1934.687	722.3599	0.12365224	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:02:13	2026-05-18 13:03:26	87	712.4727	269.43204	0.5740741	1.2751536	892.2367	-1608.3434	2984.8406	445.2515	0.19539519	0.93333334
61000000-0000-0000-0000-000000000001	2026-05-18 13:04:04	2026-05-18 13:04:34	93.888885	656.1177	97.400764	0.42424244	0.3068795	845.8289	698.0389	3953.1577	148.90715	0.6305196	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:18:46	2026-05-18 13:23:47	87.35971	701.406	164.52885	0.3030303	1.5966351	1006.1847	-509.3496	3290.889	363.3342	0.240439	0.07333332
61000000-0000-0000-0000-000000000006	2026-05-18 14:03:22	2026-05-18 14:10:23	84.15775	742.39703	185.90167	0.6600985	1.4410857	503.38208	-1554.5175	2628.7673	341.7056	0.24628732	0
61000000-0000-0000-0000-000000000006	2026-05-18 14:10:23	2026-05-18 14:16:11	79.88642	744.30115	149.59206	0.44444445	0.76407915	1248.875	-845.4015	2795.9006	768.06213	0.104010366	0
61000000-0000-0000-0000-000000000006	2026-05-18 14:16:11	2026-05-18 14:22:22	80.88562	726.11707	126.92216	0.39119804	0.8168418	1382.0391	-495.4228	2872.6047	194.87558	0.41506287	0
61000000-0000-0000-0000-000000000006	2026-05-18 14:22:22	2026-05-18 14:27:22	81.66129	740.5638	102.46308	0.35353535	0.7256283	1197.1873	-478.69833	2991.9949	153.103	0.5333749	0
61000000-0000-0000-0000-000000000002	2026-05-18 16:05:00	2026-05-18 16:10:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000002	2026-05-18 16:10:00	2026-05-18 16:15:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000002	2026-05-18 16:15:00	2026-05-18 16:20:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000002	2026-05-18 16:20:00	2026-05-18 16:25:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:27:03.275025	2026-05-18 17:32:02.275025	73.23851161947498	847.2075950517961	35.63769559487764	27.688022785151183	1.6537834470759993	0.021078454972580457	0.04016464088041853	9.773460254020344	1.018364414098963	67.47803504747014	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:22:03.275025	2026-05-18 17:27:02.275025	77.21905201815622	850.5544011662001	50.572091949845614	26.7151123013187	1.1996268852719685	-0.011428411177479211	-0.04551063794653672	9.790850886619168	1.0371069083040196	72.88488918810431	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:17:03.275025	2026-05-18 17:22:02.275025	65.69961892045156	778.7376224594991	33.41748542498736	23.267668565477926	1.6309892102686803	0.014615108996909904	0.01882672926370224	9.750306709127798	0.9601123120921015	76.77887295661283	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:12:03.275025	2026-05-18 17:17:02.275025	76.77981727742399	930.9719228413492	30.3600133713682	24.533634440591612	1.0245120849952623	0.024443947231565774	-0.021218185452217677	9.842479171269888	1.022064171216241	71.77388722778643	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:07:03.275025	2026-05-18 17:12:02.275025	68.38852178960865	838.3333942227828	50.23073299497415	25.883881935736373	1.4538874894151494	0.018663823010218322	-0.022998063457416885	9.835624007339778	1.0284410545702023	78.81372031983615	0
61000000-0000-0000-0000-000000000001	2026-05-18 17:02:03.275025	2026-05-18 17:07:02.275025	79.40845938582768	788.6928817110735	33.22083574277712	29.1030775419975	1.5415424775464255	-0.04789664560892648	0.0075258966095322	9.846080701330566	0.9911501760432236	72.40117545739855	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:57:03.275025	2026-05-18 17:02:02.275025	79.89014247919114	868.7283984998905	43.0389508620471	16.518791665602407	1.4102617375790722	0.037307830362769565	-0.019155619259791437	9.838607514865823	1.02481951129171	75.48358238121241	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:52:03.275025	2026-05-18 16:57:02.275025	79.33135934871594	758.5756964555025	37.169963620331316	19.0480221202516	1.4238771736116558	0.013610910638482049	0.02926924780356313	9.812803053474308	1.0319780798553078	71.41169764066305	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:47:03.275025	2026-05-18 16:52:02.275025	68.13848660995386	898.4015016592664	30.158253537410157	24.6592035055005	1.1403885494960564	0.031988280314366915	0.025378737430958045	9.795640856249005	0.977836449948592	76.37987748041184	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:42:03.275025	2026-05-18 16:47:02.275025	69.67493405362404	935.8152685475118	30.83397546551705	31.315278352004896	1.6302029537443827	0.026863331399936047	0.03905841209484007	9.782078910435908	0.973035136961774	67.73968663397847	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:37:03.275025	2026-05-18 16:42:02.275025	76.30242395920608	864.1963925766229	50.13336939342237	21.634249493320432	1.0760526172993832	0.01660462333846051	-0.0195433613135523	9.802061193247447	1.0177482180185786	70.8865088122936	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:32:03.275025	2026-05-18 16:37:02.275025	71.88123742392366	778.390808146535	34.572913820240544	31.37297064568303	1.7482367072064082	-0.048327283193907916	-0.021740875001006812	9.833427571421865	0.9623224923425036	78.32406612463392	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:27:03.275025	2026-05-18 16:32:02.275025	71.73418127572896	837.7814011360308	34.07680813619846	31.851645040914146	1.7382644035545343	-0.008624432336538625	-0.026411834295248515	9.810566707739639	1.0318284267901012	77.55883832724535	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:22:03.275025	2026-05-18 16:27:02.275025	66.06756808242336	774.4924436279506	53.27423935712773	21.3727632503163	1.2771116523733759	0.005532647142781011	0.018740127452849947	9.83517883262338	0.9651931011304424	67.14990688128212	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:17:03.275025	2026-05-18 16:22:02.275025	75.72010161497806	914.1364792675647	45.4058249320614	25.928403051926075	1.6245087840277042	0.04781574211952255	-0.02348715882100443	9.809616682184851	1.039209701331299	76.0518015529289	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:12:03.275025	2026-05-18 16:17:02.275025	78.81141778830013	903.5125503482784	44.956000942963	24.515746961928457	0.9784385300760687	-0.007381337611611638	0.0011861443214392642	9.842789322270116	1.0384220003368816	66.60797969740429	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:07:03.275025	2026-05-18 16:12:02.275025	74.07181410299364	885.2315668022686	39.36466065453347	16.89897936944954	1.3466090780097235	0.010299951902584745	-0.04829686384059524	9.830900397754096	0.9812183688455839	74.16533025547145	0
61000000-0000-0000-0000-000000000001	2026-05-18 16:02:03.275025	2026-05-18 16:07:02.275025	66.08670652634949	895.8799881399211	46.132325565446024	21.491166217927884	1.0177937772640775	0.022510032955987566	-0.010724492667082551	9.789628534874577	1.001129190677993	73.43176118411549	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:57:03.275025	2026-05-18 16:02:02.275025	75.98671829685519	870.351173734945	38.7651017202124	33.096253602805874	1.5208082056539904	0.04245770270478531	0.02680346274768977	9.755533236638428	1.0352735642049726	71.86275141123863	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:52:03.275025	2026-05-18 15:57:02.275025	74.62201387351817	762.5133222461593	33.273684912282526	30.927790813528443	1.1061354730747304	0.026833901197417645	-0.04496815716024774	9.827341152643825	1.0481824084403844	75.20772185625975	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:47:03.275025	2026-05-18 15:52:02.275025	66.29512537382462	882.2564529551711	46.280437601353654	26.609560909488494	0.8658292371084186	0.029744083831242538	-0.031212235717534578	9.791017399847739	0.9501187571705602	79.94571167535284	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:42:03.275025	2026-05-18 15:47:02.275025	78.65849749537459	899.9360388655795	45.02849240053016	22.67799424166345	1.3300743398546033	0.02711902331959852	-0.04585457203650781	9.819315745799715	1.0264479965622315	78.59017886017209	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:37:03.275025	2026-05-18 15:42:02.275025	73.2182771016038	805.5786463650628	44.598791948366745	29.732901579238245	1.0107870554413667	-0.03748855186096931	-0.03552607980658809	9.809386229992372	0.9516416275576902	76.98331569960035	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:32:03.275025	2026-05-18 15:37:02.275025	73.29136375207494	935.7467779586932	33.428597203750215	20.882271225141057	1.5138788012359832	0.011418568881429204	-0.005959302958238585	9.769969798719634	0.9864688758525119	71.02045887773953	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:27:03.275025	2026-05-18 15:32:02.275025	69.31547461945776	786.7832505667511	41.69543640930394	16.24486903131239	0.856852227837305	0.012892783355564458	0.042763703178113135	9.784565546798138	1.039769818958153	76.58936122878077	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:22:03.275025	2026-05-18 15:27:02.275025	69.0248404650294	946.1668319565254	48.8541342337264	26.638142135240123	0.8678182853748619	-0.025254917334073125	0.024486772189548797	9.796950759161465	1.031303217572614	69.37697696278926	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:17:03.275025	2026-05-18 15:22:02.275025	69.79299356867827	811.3339913825978	37.783867614249225	22.90344535758183	1.072359968716553	0.007845703878577748	-0.03652403886285205	9.823383277238307	0.9791635688766119	75.44759718377873	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:12:03.275025	2026-05-18 15:17:02.275025	67.4050221655297	893.8566648213377	49.745395300312595	19.80229719848129	1.5274295207713733	0.0008133427853083547	0.0045966194616383835	9.81920840421802	1.0408757481468027	69.51612982048171	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:07:03.275025	2026-05-18 15:12:02.275025	76.22330763354522	765.3461136547829	43.70567229985	29.34183779250995	0.9101950581801888	0.02552258469654156	0.007427177536873185	9.774125362311338	1.0076291968091264	73.12531534988364	0
61000000-0000-0000-0000-000000000001	2026-05-18 15:02:03.275025	2026-05-18 15:07:02.275025	69.07829221582449	875.1272872861797	43.564940319394815	19.320732409032722	1.734853445384959	0.006182865895175228	-0.047826521715148854	9.819482737149766	0.9956905824740189	74.12611480321148	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:57:03.275025	2026-05-18 15:02:02.275025	66.68160754136996	918.820106001152	54.247288614844976	24.996718416283837	1.6523866466994062	-0.019230836096437387	0.021345978495919044	9.763162346859676	1.0132772642796908	75.31512940197103	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:52:03.275025	2026-05-18 14:57:02.275025	79.23225951734683	891.317098028945	34.56638005716289	23.656785377187013	1.7044250871287734	-0.027474884330121532	-0.03409287509058512	9.79903333620155	1.0061618783635367	75.84945233952551	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:47:03.275025	2026-05-18 14:52:02.275025	78.11064637207852	874.0114581141734	45.1185374079747	15.149248341763064	1.3753177386785649	0.016717180897336842	0.001497636116253552	9.772951433158818	0.9534479892676806	68.595375519628	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:42:03.275025	2026-05-18 14:47:02.275025	79.78616049678485	933.2512384029797	51.56980849129396	34.921648585833154	0.8985621717667809	0.008531523087656832	-0.020526758948473778	9.777073072553875	1.045487821795658	76.2509479119783	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:37:03.275025	2026-05-18 14:42:02.275025	74.57726572876945	820.2448005134266	41.016141015388556	21.86964278546574	1.736000463872967	-0.044274552804991554	0.018665659628406855	9.78907516501537	1.0080017890360327	78.56002132085811	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:32:03.275025	2026-05-18 14:37:02.275025	76.03811652588692	893.0542096589331	45.819210442346254	23.85443708569462	1.0849780980920307	-0.0023054524659526163	0.03801212059330024	9.765623772426872	0.9881419898373391	68.28086785381518	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:27:03.275025	2026-05-18 14:32:02.275025	67.01929333479848	761.2331198185386	42.96958287184227	25.30581517807736	1.7981502108096814	-0.0005309015033400089	0.03958199377942151	9.77405801515167	1.0293718069145128	75.52349579632178	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:22:03.275025	2026-05-18 14:27:02.275025	68.9839165919042	783.8247734302578	48.840860672197195	32.268023347362146	1.3810491172311732	-0.020245433416699335	0.02263420430762897	9.787291620379648	0.9706860730778861	71.12815543905418	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:17:03.275025	2026-05-18 14:22:02.275025	79.36092293359978	905.3989984279524	51.15858015088337	18.560299169434693	1.5452908447045957	-0.010208411978285079	-0.038476282685417806	9.811307106486272	0.9778899449661611	74.05713905149165	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:12:03.275025	2026-05-18 14:17:02.275025	72.09242642498366	851.8367995583144	53.30752546254061	34.37812626201804	1.553696774987843	-0.04223705999383187	0.031635581438561364	9.819478451798506	0.9649799803418488	68.39632507241102	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:07:03.275025	2026-05-18 14:12:02.275025	67.09419422865957	811.1861115862874	35.576539732681454	15.262358867006721	1.5284623612808335	0.04129440108656934	0.03203496592560642	9.836691337098951	0.9550661001945455	72.25032000753781	0
61000000-0000-0000-0000-000000000001	2026-05-18 14:02:03.275025	2026-05-18 14:07:02.275025	75.74469823253382	820.8315084609919	40.26040486572401	28.48402506615654	1.334420112707433	0.043852164056208315	0.04476201135918079	9.804908670863217	1.0298501803225688	67.73987555601533	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:57:03.275025	2026-05-18 14:02:02.275025	78.80072608948227	888.5908910170897	33.29423807344098	29.165225843061616	0.9352632868040243	0.01525278872136597	0.0473643944672201	9.810462265165212	1.0018457113020778	76.17343348095713	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:52:03.275025	2026-05-18 13:57:02.275025	70.69654337041082	921.9177335820124	47.38996238039168	22.273208235980295	1.4790283778680773	0.0029181276060369146	0.03364670880271052	9.834859581268642	0.9673641637907479	65.57006347855967	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:47:03.275025	2026-05-18 13:52:02.275025	76.61049837498531	915.7712917364847	51.079563574047434	22.08524216026362	1.5770536700913944	-0.009449381009675073	-0.04908108982853104	9.838744749597687	0.9632021490488827	77.82031438171066	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:42:03.275025	2026-05-18 13:47:02.275025	73.37974853609924	892.4887674630082	54.1261254297676	22.399342316967417	1.6511872726211367	0.009651736117803275	0.045914534176741725	9.821709727951749	1.0087524215100272	78.07240724181197	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:37:03.275025	2026-05-18 13:42:02.275025	68.36432462284282	791.5837527725972	33.80950203715073	29.092339846192175	1.1135594994079527	0.04273826033951751	-0.014647224504769477	9.843826763441278	0.9675502394205225	65.31725201601074	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:32:03.275025	2026-05-18 13:37:02.275025	78.37049154077638	903.0731003760854	38.49266320992737	19.345187640345376	1.562317657326591	-0.036907614937312205	0.04817060220884044	9.75748989191205	0.9723339833551216	71.13865174673911	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:27:03.275025	2026-05-18 13:32:02.275025	76.9241553921974	907.4858616122632	45.558820876371605	20.582719209115083	0.8144779698408997	-0.018226180333122136	0.04755421072501974	9.777808295986409	0.9827340561322695	76.14049816657804	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:22:03.275025	2026-05-18 13:27:02.275025	65.08829136007783	864.023979338126	31.875932991959306	17.11711772661575	0.8899122296185487	-0.042431231369604853	0.0331585544164249	9.842856482434689	1.0105112164499848	73.72024987750365	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:17:03.275025	2026-05-18 13:22:02.275025	67.67307582009609	816.6024217097824	44.562375788983545	19.639172372191954	1.5726561937674586	-0.047953095141921746	0.021328653613380946	9.760316705278255	0.9561395190147147	76.02029450738875	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:12:03.275025	2026-05-18 13:17:02.275025	72.21842248014127	809.1036782808114	53.49980768057755	20.129496460469923	1.3728617913968943	0.04013919776391782	0.04812448972870209	9.7517040483023	0.9723241895907163	70.30702737220321	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:07:03.275025	2026-05-18 13:12:02.275025	66.67664635899177	944.6437904068783	51.032005548263314	22.875900009043093	1.5563461734452404	-0.046893008001934126	-0.0314450473518767	9.763345337639928	0.9846712186239244	78.46490885322649	0
61000000-0000-0000-0000-000000000001	2026-05-18 13:02:03.275025	2026-05-18 13:07:02.275025	73.5120043050627	787.0980905167485	49.684735773703764	26.395822661712863	1.6553555437093028	0.040727027741383356	0.04137070879815652	9.807801215918323	1.0015196900145682	79.38815511737563	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:57:03.275025	2026-05-18 13:02:02.275025	67.31884180872927	941.9767633979852	39.91870468404025	20.64244895766899	1.5962124590639237	-0.0224196738625285	-0.009238590441889835	9.799091794956153	0.9972922603835812	69.89979617826607	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:52:03.275025	2026-05-18 12:57:02.275025	75.7492344536389	930.435912879635	38.48362703966957	16.514703101769705	1.3842230254277734	-0.03958614677108192	0.04473152646795975	9.765478449516426	0.9650200404158058	72.71493497365776	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:47:03.275025	2026-05-18 12:52:02.275025	68.37252250876986	897.1097565235243	50.60706119285196	21.019159384504903	1.0799878131837368	0.04240549630287893	-0.02118564254558113	9.77106150767666	1.049397007653313	70.52113842714394	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:42:03.275025	2026-05-18 12:47:02.275025	74.85667770678786	898.1162477461194	51.83623617680058	21.145819673550342	0.9624344505528184	0.03998759054959555	-0.03407532135676464	9.765843834481633	1.031947373396746	74.97018039833473	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:37:03.275025	2026-05-18 12:42:02.275025	71.20584323639265	884.9771417449681	43.36684016852631	27.31747276361635	1.3548042877170767	0.014599756939674191	0.03120141988744045	9.802525900583316	0.9536685692294312	70.05031118238769	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:32:03.275025	2026-05-18 12:37:02.275025	75.4656513051584	874.1945838825176	31.95182343329196	22.000353178018116	1.1250095818607502	-0.03411212550769589	-0.04328932708274538	9.804942146048957	0.9678740723952469	79.70088600360654	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:27:03.275025	2026-05-18 12:32:02.275025	71.81460858448	938.3672031006408	37.90157573466734	29.025937404652105	1.0035844778815999	0.026646268168937046	0.04378720268025607	9.849150033014784	1.038050331140462	77.68932085644751	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:22:03.275025	2026-05-18 12:27:02.275025	77.43079765918098	792.6156356064387	36.55517419752158	31.73819057872807	1.0825513586939306	0.03382538340688171	0.04279583403915317	9.776965499397361	1.0048422972680242	65.44009844956577	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:17:03.275025	2026-05-18 12:22:02.275025	65.12797126767383	928.5598337343557	43.206706205465224	15.11038263688702	1.7849448485738488	-0.03320646728855883	0.044225918594086006	9.820582792440026	1.024081220127451	67.7590301289352	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:12:03.275025	2026-05-18 12:17:02.275025	74.36078207840899	853.2469700883261	52.081771660382856	33.77212912447139	1.5822595051208996	-0.0346934386900609	0.029354584499780595	9.786280793844625	0.9953568312755129	73.65722287118865	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:07:03.275025	2026-05-18 12:12:02.275025	76.26744072116104	765.4671617934163	53.955788754479755	15.812250923650893	1.3376412562151971	0.028357604948853005	0.034625984328076134	9.782594555641962	0.956628635070564	77.58706561588684	0
61000000-0000-0000-0000-000000000001	2026-05-18 12:02:03.275025	2026-05-18 12:07:02.275025	78.32802308957305	910.1995013630424	41.3803477141945	19.931402340738273	1.6369387057406448	-0.012612183625207489	-0.03196150607308601	9.792207938438596	1.0454703083777666	66.91974104391768	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:57:03.275025	2026-05-18 12:02:02.275025	69.28641717303752	834.8386176630061	47.95921523429647	20.355052001482512	1.544649840687683	-0.007748963294419785	0.005444474611286519	9.82696063276123	0.9621581817666188	79.47207998679504	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:52:03.275025	2026-05-18 11:57:02.275025	73.04134750130021	808.6949103265714	32.75254028799045	25.333532911801434	1.587675994599769	0.00025332464293785495	-0.019854571057692727	9.836090020206186	0.9530262831786704	70.03313689362055	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:47:03.275025	2026-05-18 11:52:02.275025	74.42499888268974	811.2384304537545	51.78238607084219	16.328658841395235	1.3794874907105208	-0.007901639342379044	-0.010065060388426784	9.808400568931566	1.0409898267398079	67.95964495106577	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:42:03.275025	2026-05-18 11:47:02.275025	76.42806865586192	863.594694830542	36.169713400300225	20.80559967748636	1.7252034927781745	-0.0231596701015004	0.029612900374829026	9.80880775285009	0.9989230556410544	71.42313284016676	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:37:03.275025	2026-05-18 11:42:02.275025	75.35818721138766	888.6457714659075	44.13221211455021	20.238189783666837	1.059253200747806	-0.002806867707132274	-0.0023690103393847264	9.797812988799496	1.006373424629764	65.47670478307998	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:32:03.275025	2026-05-18 11:37:02.275025	72.96343648979483	856.8678218345077	42.89888397355121	23.64480871619085	1.4193526234255904	0.04375584824668484	0.038104376909482915	9.841557572636312	0.9665829450129944	65.67920136632891	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:27:03.275025	2026-05-18 11:32:02.275025	74.40265043594653	898.2078208636317	45.75135146964227	29.048018290417513	1.491588152373888	0.014434147558284177	-0.0065678147099366355	9.80223115883607	1.0216251042339124	70.67927406236497	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:22:03.275025	2026-05-18 11:27:02.275025	69.70521903736852	936.0279091088623	33.09285132226077	15.652336523501141	1.202186029348409	0.0011548558320263885	0.009070095002728686	9.803344526392324	0.9640255694054098	67.44899600221562	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:17:03.275025	2026-05-18 11:22:02.275025	71.8768703339028	784.2741011071566	48.11433330498518	16.654549417688038	1.320856075456831	0.008034418960429647	-0.031744872422986625	9.754617862722213	0.9665532214454154	77.82994122362638	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:12:03.275025	2026-05-18 11:17:02.275025	70.63032757642931	840.7572634614125	36.14167882244787	24.440948488499505	1.1308238227402607	0.023397459275158503	0.020629653438129503	9.768326938638554	0.950025868965788	77.77191387577851	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:07:03.275025	2026-05-18 11:12:02.275025	78.9775338374928	930.7926791145239	49.49118396551973	27.51126538949191	1.1988953037937855	0.012524947952010673	-0.04279918227576196	9.773553083698609	1.0204614141789219	74.11470553565704	0
61000000-0000-0000-0000-000000000001	2026-05-18 11:02:03.275025	2026-05-18 11:07:02.275025	69.06078599487257	827.4689805158858	52.71943261332045	23.900574745276227	1.404381236631662	-0.018573164977716883	0.02099847732489006	9.753098738905226	0.9843077843749337	74.90950311584842	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:57:03.275025	2026-05-18 11:02:02.275025	70.32579318673027	818.7191164960375	30.757903945088355	30.562666290745394	1.6603449034096278	-0.02679664025382307	-0.0035321764091113886	9.794888600039119	1.008019755510636	78.30982930636448	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:52:03.275025	2026-05-18 10:57:02.275025	79.16726052250078	928.170484561702	41.81671379093976	19.904298702393174	1.1796928582028219	0.037319190999757	0.030573012063652913	9.775146560666164	0.9951565108178367	67.3110203708673	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:47:03.275025	2026-05-18 10:52:02.275025	76.97632530401522	804.1854895991273	35.17441149270954	23.583661957441894	1.031588853428921	0.014987886992589947	0.011627165314221387	9.829732121940925	1.029502747114013	67.23870639888405	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:42:03.275025	2026-05-18 10:47:02.275025	67.50333016106775	874.8329522512373	46.157314031014536	32.85278611591857	0.8725982181324454	-0.041107369056443036	0.044508333354480054	9.826790173190453	1.038323767563103	77.81383070817037	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:37:03.275025	2026-05-18 10:42:02.275025	74.4651835866603	789.518094705169	50.5893471156393	23.541934822573726	1.59530676751475	-0.03154652570404497	0.047310874802445335	9.752953463537771	0.9920162565740352	68.45780923369027	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:32:03.275025	2026-05-18 10:37:02.275025	77.12155313677903	781.1002706861968	34.42257685172939	28.887980957050488	0.8855533065147463	0.01233536861447089	0.002295635789049011	9.806335767937597	0.9846036318543415	75.1859878820808	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:27:03.275025	2026-05-18 10:32:02.275025	73.50995389042454	782.3442858705126	47.24661380366693	27.723496125967976	1.7578423957614406	0.033357403095019264	0.008128347319818797	9.778956676802784	1.0223084193977758	75.42481163386414	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:22:03.275025	2026-05-18 10:27:02.275025	70.63113871452535	847.7651347405165	52.88680297543985	31.406591121659844	1.066219454422951	0.022202016336804326	-0.0013986863104003683	9.788401389590828	1.014466272295692	67.45203179225345	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:17:03.275025	2026-05-18 10:22:02.275025	68.693809120408	845.8894208254953	39.98046594122587	19.036520191387854	0.952602511699292	-0.03869013648411601	-0.044597668562942276	9.84509510863021	0.9967362819997038	66.69162326067627	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:12:03.275025	2026-05-18 10:17:02.275025	65.52728363497584	897.8089513413515	53.52416004137211	19.99979844363814	1.2518267906538318	0.02278201854598301	0.045472713716218846	9.75147962687959	0.9574179208920673	72.83701446579529	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:07:03.275025	2026-05-18 10:12:02.275025	70.71055568955819	919.6147324183744	38.804999386848124	27.653037225027877	0.8593050796843162	-0.036854701180966745	0.001057054159966285	9.761471667916783	1.0479926221996236	71.74422116897038	0
61000000-0000-0000-0000-000000000001	2026-05-18 10:02:03.275025	2026-05-18 10:07:02.275025	77.19003157101636	758.3350024759243	30.030981555582564	32.73248375110601	1.171312320032451	-0.020034787558505785	0.040196563034780516	9.82772627384769	0.9903716882889925	76.84198735435024	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:57:03.275025	2026-05-18 10:02:02.275025	76.92825017237115	758.5728628504895	40.03151535394369	29.835091685185873	0.9635555231895694	-0.04434216437311209	0.006559878138486776	9.78612806352	1.0246666036060665	73.78314657719872	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:52:03.275025	2026-05-18 09:57:02.275025	66.44035171958177	876.3049192982674	53.52735166012096	22.68984074098402	1.2526958586578658	-0.03817239440170422	0.016638789663851794	9.831227019617762	0.9717778452277459	68.03389808768483	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:47:03.275025	2026-05-18 09:52:02.275025	79.67594174266276	816.0213561690543	30.783917859278706	15.700010643351963	1.3919979299995944	0.006761752188406023	0.01372823855783993	9.765637499632964	1.0140536375036493	74.04792803345262	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:42:03.275025	2026-05-18 09:47:02.275025	70.51504483598985	882.8708890286018	35.3434864077417	30.551654727728668	1.3616925883112079	0.03435778003880839	-0.040015782991643614	9.830891874395459	0.9741927253603481	76.63184574951056	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:37:03.275025	2026-05-18 09:42:02.275025	74.21154425201324	948.7579978215512	54.57624693277384	29.28157758601181	0.8234643062367191	-0.0309151124300356	0.009326641776361597	9.829285366852588	1.0258537644519836	73.72893734569524	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:32:03.275025	2026-05-18 09:37:02.275025	74.14354325474199	875.2238996413428	34.55940244842659	18.49182320184743	1.7206209855232086	-0.048217604344134024	0.029972493369090955	9.776468995508388	0.9960081355439359	73.43578428559205	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:27:03.275025	2026-05-18 09:32:02.275025	72.78005256151688	855.9409631776642	48.75965006579367	31.716705889896495	1.279632381544598	0.034776004118436954	0.010268570453771629	9.82865697058462	1.0417719545882362	78.05645127909114	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:22:03.275025	2026-05-18 09:27:02.275025	75.71931871267205	902.9376246198835	44.29949679386694	16.445382988349916	1.496144584343414	0.017337316006380485	-0.004056863486859276	9.795506326548214	1.0393323011591185	66.44489456194617	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:17:03.275025	2026-05-18 09:22:02.275025	69.27851783806942	805.9251692391431	39.5489620107516	18.053892662946698	1.2317140298943523	-0.032927115082814123	-0.023402236895721407	9.770772051420906	1.0136744513723794	74.13265410656517	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:12:03.275025	2026-05-18 09:17:02.275025	75.7848537794712	849.5012372380619	53.97746246897691	21.34109920256443	1.748074099483702	-0.021068750644226242	-0.013489472499070086	9.831524064664027	1.002688858064451	65.70795687883432	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:07:03.275025	2026-05-18 09:12:02.275025	69.24265880245898	872.0151900304317	30.919452361493033	30.129415059891983	0.9501435366556521	-0.04316703103621966	-0.01896474715820029	9.835830634994748	1.0196002869514826	77.22730374191914	0
61000000-0000-0000-0000-000000000001	2026-05-18 09:02:03.275025	2026-05-18 09:07:02.275025	70.37156067256821	939.3832252626447	47.19097479889871	33.91960180610347	1.290577862705804	-0.018840624771138594	0.020803558200706118	9.805052644736593	1.0100658217878868	79.22220459111487	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:57:03.275025	2026-05-18 09:02:02.275025	68.02127240260255	786.7705030319479	37.61876974800417	27.557783964796123	1.1545582752217263	0.016767631249038614	0.04672305128585748	9.755509536076135	0.9542043184235556	76.85801765546395	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:52:03.275025	2026-05-18 08:57:02.275025	75.57931511675633	764.7143383587287	48.14523802881895	15.894076086347724	1.1056741146119198	-0.017660958260701333	-0.03712727702897281	9.754687729154403	1.0049044951518733	78.82222709798403	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:47:03.275025	2026-05-18 08:52:02.275025	69.78116632496648	924.3808528971487	42.43898418790304	21.30348369075822	1.418424581745247	0.004588270917398732	0.03106759247890467	9.8239542582897	0.950130568464087	71.67645804629697	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:42:03.275025	2026-05-18 08:47:02.275025	77.81967697977393	900.814253324677	39.09905518016739	21.342670854857854	1.0523293380063725	0.04682428953742375	-0.0015756783252647497	9.754752230293377	0.969141988864541	68.60284277549641	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:37:03.275025	2026-05-18 08:42:02.275025	70.23487196578184	924.7010130346418	41.006883718268995	23.97345402503919	1.1043973309395632	-0.03515631571543687	0.04799587686762395	9.79222088959834	1.0167082058670376	71.18718097895334	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:32:03.275025	2026-05-18 08:37:02.275025	75.02092739442901	816.1436902470919	44.89112481149091	18.76488559644956	1.2157630203099774	-0.04981127307184052	-0.03307023455284186	9.805357517000221	0.9552678282853444	75.4258893617292	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:27:03.275025	2026-05-18 08:32:02.275025	71.55293840848226	840.1220744847272	34.81553033759769	32.32440936350609	1.6261877963251734	0.01917387072136123	0.0067932267666648075	9.752398085717305	0.950978659315006	79.54321932505646	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:22:03.275025	2026-05-18 08:27:02.275025	66.69975703135441	774.8639364167453	54.397002981274944	21.138857561476602	1.2661469381735384	-0.01309510615991196	0.04430412410142692	9.817900973708484	0.9962996307891432	71.25874592645215	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:17:03.275025	2026-05-18 08:22:02.275025	67.4099166854945	943.1251690898582	51.16072875640383	27.37417213634891	1.6643372211054306	-0.02774146629905432	0.027139857552617302	9.79259385834963	1.0124810419259325	67.3555316963343	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:12:03.275025	2026-05-18 08:17:02.275025	70.84741337731113	802.2110337852996	54.78036005559027	19.413534888822227	1.5328810397229309	0.03215141899155004	0.03738903675958154	9.774621799636472	1.0431290860888225	76.47902993811243	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:07:03.275025	2026-05-18 08:12:02.275025	67.08414823978208	879.9999884092889	50.37763402891852	16.401230693624687	1.5758648785339484	0.022500415140269264	0.01055990996253333	9.776851360341864	1.0477768675349277	66.0256299746188	0
61000000-0000-0000-0000-000000000001	2026-05-18 08:02:03.275025	2026-05-18 08:07:02.275025	69.7476885729045	901.2819551871924	45.71608638831168	22.601707559274224	0.8904595145971153	-0.047014057160155345	-0.001201786407529215	9.785940975102188	1.0183017844281277	65.46742579568455	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:57:03.275025	2026-05-18 08:02:02.275025	76.9577336587025	884.632777280354	54.297339317753035	31.888949218484722	1.2624571103634403	0.031712194011427136	-0.003447397477004732	9.846756937088866	1.0498440210637554	74.2145802701465	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:52:03.275025	2026-05-18 07:57:02.275025	76.26705933525199	783.1230137651708	53.07859087093226	33.323435644164796	1.334267925892302	0.024641330417997098	0.047056809939880914	9.76091610340201	1.0331012526831866	76.2540422874566	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:47:03.275025	2026-05-18 07:52:02.275025	65.99451049520063	913.4042363652327	36.17302988205044	27.176843080792203	1.5460801436737774	-0.03522077215028663	-0.010171951144239168	9.758667618957602	0.9757306110224231	71.13290368506381	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:42:03.275025	2026-05-18 07:47:02.275025	74.70644970308561	825.6770678725464	52.322239254185334	23.218628009224425	1.5249533637058255	0.04804780571976741	0.017927998105493642	9.798158435472642	0.9613069516892223	65.11240101125466	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:37:03.275025	2026-05-18 07:42:02.275025	67.04986670393932	827.7907860259735	42.90546223260945	21.774155249629406	1.2508189651021393	0.040272942620057206	-0.04129519153727761	9.786627370115749	1.0228965546201538	73.62594901611378	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:32:03.275025	2026-05-18 07:37:02.275025	74.7237288404371	930.7877954449912	38.910697864581785	17.16723966681741	1.2354062949056293	0.04916701940229787	-0.032885054014859416	9.799732562299868	0.9924129248300725	70.87283292564787	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:27:03.275025	2026-05-18 07:32:02.275025	70.48706260766257	910.9293619885418	47.998353934546564	24.50268341242827	0.863315094481097	-0.006786262906944507	0.010614631083790016	9.8317425095349	1.0023923036638602	72.54787054596517	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:22:03.275025	2026-05-18 07:27:02.275025	65.98045997714081	767.0406070560285	36.58837658746919	23.035101782543116	1.1775205495051946	-0.005142341598578917	-0.022318270600673908	9.821164071837751	1.013458451889489	79.5049293444894	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:17:03.275025	2026-05-18 07:22:02.275025	79.40898540967221	948.4256088182185	49.243071066979525	17.16018163181274	1.0994729606091003	-0.03767115307772198	-0.012796008730140397	9.825469972723829	1.002406589370561	65.97392896228065	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:12:03.275025	2026-05-18 07:17:02.275025	78.53144730655869	752.0998994590968	49.40980511013065	23.797706174185244	1.6860267036619865	0.015897299926015365	-0.026013588912102283	9.831668715195109	0.963425760575146	74.37673715232067	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:07:03.275025	2026-05-18 07:12:02.275025	78.29568355877717	790.7965884796638	37.89876349022476	27.058557861905015	0.9867480282088972	-0.0365994496062319	0.030888872222172223	9.820250564227601	1.0354907158213744	66.09302735749888	0
61000000-0000-0000-0000-000000000001	2026-05-18 07:02:03.275025	2026-05-18 07:07:02.275025	66.71752152973964	943.3569440403026	50.393801457212646	30.516563189013986	1.0951446644246723	0.027112256085485134	-0.010429484308749348	9.772870431516202	1.0258909161371423	65.89789559410444	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:57:03.275025	2026-05-18 07:02:02.275025	73.01658347468847	940.325476901256	54.452570848733586	25.21754320661951	1.6248627757651697	0.0010165784070331335	-0.0015394268930771088	9.798105156821782	0.9897474204246868	69.70207230871952	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:52:03.275025	2026-05-18 06:57:02.275025	67.652924332572	884.6810989858975	38.0831685159174	17.961058880473413	1.064164456867058	-0.04726529136784768	-0.015308646372951373	9.825898970245152	0.9522934526040889	73.20631047390353	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:47:03.275025	2026-05-18 06:52:02.275025	69.73893866104797	910.6826295411383	45.19205094360247	21.509329328989235	1.1895552201087611	-0.012398007958974146	-0.037642067117295896	9.811400659952154	0.9530224539839864	76.28331759049931	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:42:03.275025	2026-05-18 06:47:02.275025	73.36147598262595	916.9089139849251	30.387978510995968	30.968950074887825	1.271061163516146	0.01837546935544701	-0.007735286156317203	9.774317145114889	1.0110468251779725	74.25722996912614	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:37:03.275025	2026-05-18 06:42:02.275025	77.25394546692407	761.9703233797015	33.03071611179162	30.859523829348507	1.0221307771822574	0.009529369837926141	-0.04829555065981655	9.815211428632932	1.0196897744092845	71.56547608685086	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:32:03.275025	2026-05-18 06:37:02.275025	67.98229709342547	856.9965450035464	50.852565490955726	17.950564047901437	1.7799086547468783	-0.03193578986379151	-0.0008552578334481281	9.812583500201798	0.9759762573492604	66.81855028869414	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:27:03.275025	2026-05-18 06:32:02.275025	76.52815622570951	817.251834325958	35.46236240061413	29.38429889467061	1.631397325531213	0.02581573491616805	-0.04283850709135839	9.778064553999133	1.0400803315858045	79.96150312042151	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:22:03.275025	2026-05-18 06:27:02.275025	74.86610352987022	879.07989915401	31.06576548782547	17.066974328599525	1.4838664448916523	0.023371387129715954	0.03316627520294278	9.828385856132524	0.9680678625745697	79.71491851710033	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:17:03.275025	2026-05-18 06:22:02.275025	69.42112918719192	772.8938207851529	37.8550684158083	32.587413340615896	1.3619558769348536	0.02317974805443504	0.015207485406986604	9.842035391338984	0.9585519614168724	78.0479709588945	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:12:03.275025	2026-05-18 06:17:02.275025	72.76851354556986	831.8749731372237	54.62967184130487	30.992384938831037	1.1758435731437427	0.03989814741179769	0.00390904992296439	9.824665466734581	0.9934532943558564	79.45676728129772	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:07:03.275025	2026-05-18 06:12:02.275025	66.21352686062811	771.0315502757367	41.05711347398716	23.354181993849	1.041408287499793	-0.001685595620443861	0.014295880074175732	9.750457996830866	0.9841297048030458	72.78585131414609	0
61000000-0000-0000-0000-000000000001	2026-05-18 06:02:03.275025	2026-05-18 06:07:02.275025	72.91979278419237	803.3868980606989	35.29539020213739	30.35210788413213	1.0008955384178324	0.015316374332573185	0.04052611416001016	9.827426687074041	1.0243297158182536	77.16402334891595	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:57:03.275025	2026-05-18 06:02:02.275025	69.52597973367968	850.2563625630777	37.17498840418462	33.353620911238735	1.5454994448814035	0.042316091561660746	-0.04692558611955575	9.814639470252992	0.9851390709888391	77.38928316035256	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:52:03.275025	2026-05-18 05:57:02.275025	75.25137739738682	925.8233350428347	39.48906144714217	29.70594322080882	1.1128246519517468	0.03944747098241501	0.010924537103054278	9.816309891239502	0.9609635792117532	77.93399924736049	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:47:03.275025	2026-05-18 05:52:02.275025	71.97146378230997	938.8745470308191	33.05388138385338	24.206981797112984	0.8980657556163629	-0.02435571754611017	0.036216196474134196	9.823253104796857	1.0160948256861666	71.38380233352387	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:42:03.275025	2026-05-18 05:47:02.275025	72.79152571863891	912.4081074355829	34.94297547990737	18.52189933965859	1.1183341519983012	0.03893907365709874	0.043593632996218865	9.841676470366657	0.9718415814638441	77.32778213513274	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:37:03.275025	2026-05-18 05:42:02.275025	70.17441611016254	812.0068430579122	33.2234298640122	34.32392327560256	1.7291499902948786	0.0016130319755098405	0.029522274132165904	9.764556689426962	0.9658502536921645	75.51217054981406	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:32:03.275025	2026-05-18 05:37:02.275025	66.62571822377458	765.5633946359187	49.4303390083808	18.69444867243237	1.383073746368849	-0.04897266607206601	0.027199165074639667	9.823040324308064	0.9558021443915244	68.08660200255918	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:27:03.275025	2026-05-18 05:32:02.275025	78.90274197160602	889.2745796590593	39.901546862184745	28.961194109142046	0.9554297952857604	0.019357195795890264	0.015233472981747709	9.77847596767656	0.9541923990778501	74.97606898878308	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:22:03.275025	2026-05-18 05:27:02.275025	71.56126980534279	863.1027446912904	36.465779416391186	30.110396110643904	1.0140479385978072	0.025787460294125195	0.01585188970508908	9.839785726574137	0.9800746502998573	77.80670711989322	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:17:03.275025	2026-05-18 05:22:02.275025	69.85133758911209	881.3338099790674	36.6783738723374	31.962387538067176	1.27007995451043	-0.020637219576491096	0.034017645847687406	9.802186806988798	1.0460982448585736	65.00801929537441	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:12:03.275025	2026-05-18 05:17:02.275025	70.77001531763405	895.5891204591761	33.037387142371976	18.236451137545153	1.5429251406372013	0.03640561498323418	0.015610249322254632	9.798029769074713	1.0327380314822139	79.33284548310979	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:07:03.275025	2026-05-18 05:12:02.275025	78.82285871638803	750.9075647323891	42.60525444998555	27.18394038070617	1.0462521242454181	-0.029625512935805776	0.003780838860621194	9.818935579749663	0.974497201166215	76.61237489313382	0
61000000-0000-0000-0000-000000000001	2026-05-18 05:02:03.275025	2026-05-18 05:07:02.275025	70.43834608040052	795.2818629017556	34.933714813128745	26.477777822708077	1.199878545250879	0.006345395870236567	0.01774711123766362	9.78780598316619	1.0351722291736887	72.31815662289803	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:57:03.275025	2026-05-18 05:02:02.275025	66.63639080780604	857.8621757202978	42.989330218602404	26.847916780637995	1.416077414566613	0.0005793880027467474	-0.028433565072114364	9.761526345418579	1.0122404540333412	76.44808249892591	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:52:03.275025	2026-05-18 04:57:02.275025	79.30782224353698	788.4990762978298	31.523914955605193	24.35838195664127	0.9314916399197561	0.0007691285034957945	-0.04513363659363201	9.776329422946954	0.9848928063079725	69.10582393849533	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:47:03.275025	2026-05-18 04:52:02.275025	73.58999227878489	873.6253388046839	47.95162349401368	16.769864803802484	1.793751070718229	0.008766068189545992	-0.03648828492251806	9.802586527326131	1.0110693346628035	70.4184615698301	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:42:03.275025	2026-05-18 04:47:02.275025	65.42975948480041	837.2790608796283	39.20270014180944	23.481119236428935	1.6094454263137605	-0.024574573706907188	-0.015481583072066755	9.836331585863169	0.977480615557259	75.55595795812204	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:37:03.275025	2026-05-18 04:42:02.275025	74.52005712408258	772.266340223071	43.14393066538824	25.204695306214305	1.3659212961508789	-0.0008591105658022138	0.03209467080949853	9.772914473833128	0.9863549405093399	66.91492409075826	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:32:03.275025	2026-05-18 04:37:02.275025	70.45024274548355	792.0725665670305	44.553490598125144	30.07135760269015	1.1403061783808301	-0.027737765449439	0.0388830593372133	9.756616280369492	1.0457220435342665	72.87055589184921	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:27:03.275025	2026-05-18 04:32:02.275025	73.52636934275642	763.507847423243	49.366081968146474	17.45868288462015	1.0954953145463409	-0.037826827212912445	-0.006257760288427908	9.809655370421853	0.9801212289209259	78.45783107976624	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:22:03.275025	2026-05-18 04:27:02.275025	68.56149887906298	781.9412684246807	49.26349649765877	19.481095213417234	1.0782380989838172	0.011495871879565335	0.03662767316806839	9.788359602561911	1.0259004177332476	69.7857281205019	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:17:03.275025	2026-05-18 04:22:02.275025	76.57755330456274	918.0355603934656	50.40910236083427	29.805863363076185	0.9642707159154227	0.013749394926535818	0.04565312626486272	9.761669320065709	0.9773163250685167	78.97319526882792	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:12:03.275025	2026-05-18 04:17:02.275025	75.91295054882843	922.8678272590705	51.56537976417006	26.130923351289365	1.6580872750643951	-0.02888528928591985	-0.045827466877871294	9.846718027001996	1.0132992303976558	66.65134141578469	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:07:03.275025	2026-05-18 04:12:02.275025	78.55211766653143	786.2512666442298	45.01386331549537	31.527071485057053	1.01635886630528	-0.006779212784998399	0.009783663774073893	9.825755899818725	0.9600813398458378	79.29021060266943	0
61000000-0000-0000-0000-000000000001	2026-05-18 04:02:03.275025	2026-05-18 04:07:02.275025	79.61190938069562	845.8605989009529	47.55564960447818	15.628203972846695	1.6360423429313544	-0.011314000200266627	0.01166832261613062	9.776249080399417	0.9988942183429468	78.79890887901247	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:57:03.275025	2026-05-18 04:02:02.275025	72.43661624100638	872.9352254119523	43.78783726343832	34.718675636227054	1.148654627816028	0.023254495809096748	0.03727795340725025	9.813138623921741	0.9845679452325936	73.30390362475585	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:52:03.275025	2026-05-18 03:57:02.275025	65.69985777543461	903.8274339218605	48.5300129751278	16.560603111278045	0.8784516251507759	0.006588479483450649	-0.004735668403876889	9.752367325849427	1.022335418091884	79.2524214796359	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:47:03.275025	2026-05-18 03:52:02.275025	69.06088586314229	813.1015412097962	33.23155482165651	15.72728464231663	1.1686755480668312	-0.037970603302174014	0.03328816965103269	9.796346422512041	0.9690133969483771	68.8747731071591	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:42:03.275025	2026-05-18 03:47:02.275025	75.9798642358162	843.6561181776545	45.56171864156558	24.219913927623015	1.3200296926533812	-0.04280847494044193	-0.008418937758668067	9.808413687935841	1.0031781982698418	68.09946933751198	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:37:03.275025	2026-05-18 03:42:02.275025	74.9682373449346	828.5710701004878	52.70623378185072	20.76263330507285	1.6325099045444842	-0.010652768700206594	-0.012680253690421604	9.790204047155623	1.0005141232009396	69.04955120488387	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:32:03.275025	2026-05-18 03:37:02.275025	74.37694064818056	870.0767103705211	34.49937515205894	28.089355221039945	1.4368481196526637	0.03772057699671853	-0.03627719670266292	9.836901963401907	1.0188450495484138	70.75694921109218	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:27:03.275025	2026-05-18 03:32:02.275025	73.80280713836882	850.8957272626685	34.44375945162846	22.38830681351694	1.382419583758428	-0.005489844418122766	0.028808493568593385	9.768629006014939	1.0120375445333496	79.54869696457722	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:22:03.275025	2026-05-18 03:27:02.275025	75.76111615035958	826.9813503690167	47.38209945467905	24.105429021149792	1.6612113571826899	0.0024251238209563666	0.0055536400790877835	9.791680385934951	1.0355896396290094	74.69151615211906	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:17:03.275025	2026-05-18 03:22:02.275025	78.28110070119025	753.2588886518475	35.62091676951424	34.401941518005216	1.6883551899138745	0.018840530505783007	0.019435435531205345	9.787927372951161	1.0046299705224673	75.14113342045124	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:12:03.275025	2026-05-18 03:17:02.275025	74.30738977465579	918.1938294402823	54.008293884544095	29.18770247491098	1.6329152074119564	0.02943193684713455	0.03409960191103856	9.758613235067095	1.039612756987936	75.04960421835055	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:07:03.275025	2026-05-18 03:12:02.275025	79.34706574827068	824.4044504727717	35.29744576005514	15.050919347220155	1.3788039215780676	0.01364415899974851	0.03787088395677585	9.822123745519104	1.0012610300118268	69.86353055663147	0
61000000-0000-0000-0000-000000000001	2026-05-18 03:02:03.275025	2026-05-18 03:07:02.275025	72.05012524800992	878.8788595674783	38.67382174045709	26.37109438040853	0.8959509225938023	-0.04948228825561321	0.0031753061682910505	9.775532438675434	1.029804449445226	72.22897503011627	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:57:03.275025	2026-05-18 03:02:02.275025	74.40991340195745	918.4294314752989	43.7569359542149	30.40991771184606	0.8562320824613501	0.030803572448641944	-0.008701182696736476	9.829128725063121	1.03566593597676	69.17545555325736	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:52:03.275025	2026-05-18 02:57:02.275025	68.86354832370502	829.7281035515847	51.26802425286763	27.935776639419963	1.315982601577918	0.011228954230607859	0.006978688895891351	9.801673549501938	1.0428248959997153	70.92873463133196	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:47:03.275025	2026-05-18 02:52:02.275025	69.05552099080259	941.0789343886539	31.061725730500363	24.54008294362719	1.1918252738496724	-0.0022460273813930537	0.030359271548719965	9.804670930177272	1.0372242193917136	74.2593397370427	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:42:03.275025	2026-05-18 02:47:02.275025	77.82674757546792	873.0636210645022	42.182949975507	31.98969647749847	1.613547484838957	0.04599420242350208	0.01953218896504272	9.843324879106774	1.0399186888059464	68.1313841424086	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:37:03.275025	2026-05-18 02:42:02.275025	76.46719076294745	927.227015006764	30.967614254346667	26.976550142632362	1.5040345666280204	0.01959915602608868	-0.04321895972536394	9.813597464234554	0.9771131944365117	71.12782854675194	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:32:03.275025	2026-05-18 02:37:02.275025	79.55578747049613	920.5951560320253	47.01068821854287	20.18077702974724	1.0876344856200113	0.021425496138768915	0.018713688883021537	9.783224422740508	1.0463181396062406	65.49055169841704	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:27:03.275025	2026-05-18 02:32:02.275025	79.81843488926536	920.4338374375011	51.90238629578875	23.69047550795027	1.468924893990623	0.02150102412119692	-0.003475868429838068	9.80805761356023	1.0365757111029184	73.88628588981827	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:22:03.275025	2026-05-18 02:27:02.275025	69.04581689020033	896.876591455754	48.07143102572236	34.12198506739187	1.6470782240279158	0.0009954011380282485	-0.010605392549845584	9.767001976698216	1.0479855562451441	76.62837764934963	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:17:03.275025	2026-05-18 02:22:02.275025	73.14356255134398	881.9887797386363	37.570408267978266	30.883248814914843	0.997076245167575	0.006069083757277771	0.04423313082625498	9.787472777911155	1.0015353898754695	74.9222793279948	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:12:03.275025	2026-05-18 02:17:02.275025	67.53853069710036	947.5640541645671	47.22298906309153	15.364005010318174	1.779078621772101	-0.030277126235317243	0.016241701383342758	9.849827957517713	0.9964431757308665	72.31573230077979	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:07:03.275025	2026-05-18 02:12:02.275025	72.67767795920629	784.780664377415	35.478851256584896	27.43734197564139	1.6227989526964999	0.025685259273646538	-0.0323960294075073	9.829405124857724	0.9754044612685854	69.8261752738074	0
61000000-0000-0000-0000-000000000001	2026-05-18 02:02:03.275025	2026-05-18 02:07:02.275025	67.67997810774838	864.5407151159945	51.18656108676801	24.31477924228725	1.196132613545333	0.04266555293359482	0.016352353078152998	9.831982178165331	0.9954227447762023	65.27715801028066	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:57:03.275025	2026-05-18 02:02:02.275025	66.51976747167407	892.2942248557509	42.06634029751061	30.127850927367987	1.2137898078744023	-0.01293877082593	-0.001194223023382325	9.805100538199161	1.0495118363544291	72.92408137501172	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:52:03.275025	2026-05-18 01:57:02.275025	71.08800381548724	759.975989537833	54.90645972322197	17.738052403056905	1.0652313607731205	-0.021182645302327677	0.04284970019120736	9.836230950482596	1.001429961533829	76.59518578187117	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:47:03.275025	2026-05-18 01:52:02.275025	66.5660849649737	905.2889131247366	39.49161301080585	19.665360161430282	0.9629092621680342	0.03873545038549746	-0.014186150630842144	9.755575501761934	0.9540296949895363	79.47754354219852	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:42:03.275025	2026-05-18 01:47:02.275025	70.05503451457163	937.7369759414696	50.281565967343596	21.346851656849534	1.3738191260072155	-0.046997865817544754	-0.03454415216530957	9.762350733767782	0.9589876742205977	69.8380782155101	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:37:03.275025	2026-05-18 01:42:02.275025	69.04123440741793	946.0942645742949	52.139279879142755	15.03179870855024	0.8104059979238101	0.010630332109454743	-0.049384968080475815	9.754859627909465	0.9850107515448063	68.9544368204641	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:32:03.275025	2026-05-18 01:37:02.275025	73.59118161227468	867.4201596522021	39.562564339636914	32.5202985204658	1.0014768700772958	0.007710312312002365	0.04702785782786685	9.814629654786149	1.0053108447781198	67.89428394479343	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:27:03.275025	2026-05-18 01:32:02.275025	68.02890835744549	834.768522780887	35.15739881531073	23.68438228847374	1.2145679787829793	-0.02536588749730777	-0.011223196205849731	9.817044051974246	1.0210229705642155	79.41403946472323	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:22:03.275025	2026-05-18 01:27:02.275025	68.82584599550599	794.2531709066228	44.53627482713233	22.029994522923097	1.655372185485652	-0.04438715100529216	-0.001017779394228334	9.765439320377101	1.0223410513746585	78.49786272997875	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:17:03.275025	2026-05-18 01:22:02.275025	71.96527800952367	750.2260421159974	38.728477130199764	17.238294129261426	0.96685714861881	-0.012533946235104114	-0.041378241588470394	9.838821968297157	1.0173628923801907	69.72143821409156	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:12:03.275025	2026-05-18 01:17:02.275025	65.13717417513767	851.2464555825583	50.25237369531582	31.216526314538694	1.2378634190312974	0.029615231643786974	-0.005476342795086554	9.835030529767916	0.9788240726807621	74.49485627560271	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:07:03.275025	2026-05-18 01:12:02.275025	75.56793938766037	868.520392241063	30.12649214257078	21.100830752336943	0.9965880379512801	-0.031396207842124005	-0.04490632902940981	9.756772714718169	0.9588367247332579	69.52975257806234	0
61000000-0000-0000-0000-000000000001	2026-05-18 01:02:03.275025	2026-05-18 01:07:02.275025	71.85548120783619	873.4925345424404	44.810824148004016	25.598004775362774	1.3067310232846199	0.04980648336980942	-0.046284919644443326	9.838521236389926	0.9696063705793113	76.26198468170912	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:57:03.275025	2026-05-18 01:02:02.275025	78.27919705716721	760.8435052737806	50.53111215046446	15.51990802369858	1.6415001502208628	-0.03176466035043038	0.017796830308844824	9.808824275818631	1.0395131822270753	67.70269320722304	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:52:03.275025	2026-05-18 00:57:02.275025	65.24717333914315	851.0430129408398	49.869461268781194	18.972224666129694	1.044806143765554	-0.014345122142385036	-0.0021808591264639993	9.822907580174528	0.9531873584533043	67.46409222732791	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:47:03.275025	2026-05-18 00:52:02.275025	72.07062532866033	776.2388348600872	41.04611295107261	28.182555389039972	0.9667241097265695	-0.018133174486455572	-0.001815618090817428	9.797944171828318	1.0163211376004422	73.66667389069951	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:42:03.275025	2026-05-18 00:47:02.275025	66.27015967587458	875.4801765835741	32.99769632711458	24.701549552054093	1.3644646677704617	0.013444331252858377	0.036043162830116146	9.78456137694469	0.9547303910509327	69.22671385836698	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:37:03.275025	2026-05-18 00:42:02.275025	77.32024765312663	854.4766150685717	37.930242187151656	33.16896178383973	1.0756094048214517	0.03265140007322369	0.04107543612861178	9.810907061052749	0.9609563969446906	72.70556178303063	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:32:03.275025	2026-05-18 00:37:02.275025	68.15250145158508	764.3697726568947	53.27479057818579	15.572362389304079	1.0873054406629818	-0.04870376563016232	-0.012857497290186835	9.75840593792696	1.001181364458064	68.06073340260522	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:27:03.275025	2026-05-18 00:32:02.275025	73.63942691405988	834.8918178106956	42.31514140296715	20.70811837830353	1.5818287560574904	-0.048324634092775876	0.03786550552384742	9.790016327935877	0.959112987556303	67.73243422500252	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:22:03.275025	2026-05-18 00:27:02.275025	66.20832558275195	803.4172514808516	49.6234509091517	28.517931908589226	1.745072365241758	-0.018177221669542963	0.044728686162053236	9.848919168868235	1.0188962538868698	70.00965741343676	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:17:03.275025	2026-05-18 00:22:02.275025	73.26170759333235	876.5345499244344	43.60942793512785	33.674757386874404	1.2794668561312232	0.03968073629551068	-0.013529598265441603	9.763126055971366	1.0182942020881725	65.45957979131559	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:12:03.275025	2026-05-18 00:17:02.275025	68.41726034080123	800.6881058470858	47.53161033943041	30.45741297575461	0.8022687776046811	0.01294908533200545	-0.03743261212714238	9.786017807603663	1.001046680309107	72.91988196037664	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:07:03.275025	2026-05-18 00:12:02.275025	76.96149833999692	797.2597166108488	37.71147196440114	29.41231299725215	1.4137915096959528	0.008354128427794594	0.02718856594381376	9.84132249967929	1.008710617521463	76.48944221555116	0
61000000-0000-0000-0000-000000000001	2026-05-18 00:02:03.275025	2026-05-18 00:07:02.275025	69.33789874622532	890.128626642031	53.29406769957814	33.82795948692769	1.4599147679275195	-0.026739949544266575	0.029987124477450583	9.776619658863169	0.9707600493142082	70.62201075268288	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:07:03.275025	2026-05-17 22:12:02.275025	67.33308099693622	820.5902562000621	\N	28.37840056996638	1.0996869484601781	0.038902423341810446	0.020214492200127943	9.813388491452022	1.0032948207795813	67.98516937530066	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:57:03.275025	2026-05-17 22:02:02.275025	72.42906877004334	884.4199793943116	\N	19.348738611742696	1.2756444649523033	-0.016426689759541112	0.012976317731830084	9.760780609476651	0.98348734320105	78.52876566493029	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:32:03.275025	2026-05-17 22:37:02.275025	66.20702254571758	799.3762842750639	\N	22.344407523113915	1.2369505130416887	0.024641167602005964	0.020347587266398265	9.84239700159489	1.0124788633297543	70.39742766052791	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:32:03.275025	2026-05-17 19:37:02.275025	65.18661907473741	937.0763588945811	\N	16.58414490091713	1.637758552082213	0.03272668235525096	0.029878983451533933	9.777068737076801	1.0089101115494226	73.5251389911967	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:32:03.275025	2026-05-17 21:37:02.275025	78.2084152222998	821.2686231779011	\N	23.835945051240472	1.5345093257322304	0.012804642746239533	-0.02774019377938193	9.819884516220974	1.0386071539194497	68.65513764867589	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:22:03.275025	2026-05-17 22:27:02.275025	68.87197553507025	812.6367547212598	\N	34.89873319248298	1.02379983635803	-0.034387856015769526	-0.0076933236339551195	9.766457113517232	1.049017955905463	77.57376746996994	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:47:03.275025	2026-05-17 22:52:02.275025	71.55045328981574	890.863845216944	\N	25.038607126088742	1.418819270236008	-0.04962284096635688	-0.04286445749157417	9.754541557004215	0.9924920745561711	68.77569180227013	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:57:03.275025	2026-05-17 23:02:02.275025	76.78826285369702	948.7203172496208	\N	21.33853496477571	0.8392276537785657	0.026245457546926712	-0.0023383612075760438	9.838504794483123	1.022863996486741	74.47313330115138	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:37:03.275025	2026-05-17 19:42:02.275025	72.9290655103707	780.517422841127	\N	18.296743641352077	1.0055585144899117	-0.011275985567080073	-0.03618069590178019	9.755875320427812	1.0226456328850666	77.79460345179501	0
61000000-0000-0000-0000-000000000002	2026-05-18 16:25:00	2026-05-18 16:30:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 15:50:00	2026-05-18 15:55:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 15:55:00	2026-05-18 16:00:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000001	2026-05-18 20:25:00	2026-05-18 20:30:00	72	0.83	42	22	1.8	0.1	0.2	9.8	9.8	7.35	0
61000000-0000-0000-0000-000000000001	2026-05-18 20:45:00	2026-05-18 20:50:00	155	0.39	4	0.5	8.5	0.02	0.03	9.8	1.2	129.2	0
61000000-0000-0000-0000-000000000001	2026-05-18 20:50:00	2026-05-18 20:55:00	155	0.39	4	0.5	8.5	0.02	0.03	9.8	1.2	129.2	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:00:00	2026-05-18 16:05:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:05:00	2026-05-18 16:10:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:10:00	2026-05-18 16:15:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000001	2026-05-18 20:55:00	2026-05-18 21:00:00	155	0.39	4	0.5	8.5	0.02	0.03	9.8	1.2	129.2	0
61000000-0000-0000-0000-000000000006	2026-05-18 22:51:32	2026-05-18 22:58:00	75.13207	784.8978	99.30844	0.40243903	1.0646659	1037.7633	-1408.1083	3362.7126	231.33365	0.32477796	0.29333335
61000000-0000-0000-0000-000000000006	2026-05-18 22:58:02	2026-05-18 23:03:18	76.398735	762.39325	212.95636	0.556391	0.8957836	1012.2967	-831.86127	2590.7266	331.187	0.23068155	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:15:00	2026-05-18 16:20:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000006	2026-05-18 23:03:18	2026-05-18 23:10:20	82.70053	760.8067	168.91805	0.62015504	0.87350345	631.0937	-1658.2462	2941.714	759.3208	0.108913824	0.37666667
61000000-0000-0000-0000-000000000006	2026-05-18 23:10:21	2026-05-18 23:18:32	74.86777	778.6966	140.9644	0.52380955	0.9448407	167.01228	-1347.22	2504.6982	320.61765	0.23351106	0
61000000-0000-0000-0000-000000000001	2026-05-18 23:31:26	2026-05-18 23:37:13	73.23735	809.2597	121.010826	0.4550898	0.9289676	1459.5469	-1490.3938	3183.6672	216.71085	0.33794963	0
61000000-0000-0000-0000-000000000006	2026-05-18 23:37:13	2026-05-18 23:48:06	73.984375	789.4727	175.42387	0.5185185	2.9076746	299.12778	-352.1058	3530.675	340.39832	0.21734647	0.36
61000000-0000-0000-0000-000000000006	2026-05-18 23:48:06	2026-05-18 23:54:30	72.611115	867.0161	104.90015	0.47978437	0.90199214	806.8952	-2024.0167	1946.7736	243.44756	0.29826182	0.7
61000000-0000-0000-0000-000000000006	2026-05-18 23:54:30	2026-05-19 00:00:08	71.873344	792.71875	142.01268	0.5052265	1.2535018	1150.8398	-1621.7454	1605.229	588.73315	0.12208136	0
61000000-0000-0000-0000-000000000006	2026-05-19 00:00:08	2026-05-19 00:10:16	71.749344	810.82184	161.97617	0.5992714	1.1800119	1192.909	-2094.9756	2453.8203	917.00214	0.078243375	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:20:00	2026-05-18 16:25:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:25:00	2026-05-18 16:30:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:30:00	2026-05-18 16:35:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-18 16:35:00	2026-05-18 16:40:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000001	2026-05-19 00:41:26	2026-05-19 00:47:20	67.863205	877.9961	197.24942	0.5859375	1.0043322	-138.83482	-434.25266	2290.4363	282.4455	0.2402701	0
61000000-0000-0000-0000-000000000001	2026-05-19 00:47:20	2026-05-19 00:52:52	64.636055	910.59314	112.414024	0.5919003	1.4322509	1747.3135	-1715.6798	2218.142	147.28209	0.4388589	0.01999998
61000000-0000-0000-0000-000000000003	2026-05-19 00:52:53	2026-05-19 01:07:31	67.45399	857.51105	176.34756	0.5194085	0.6306649	199.04964	-2008.6986	1446.354	533.94226	0.12633198	0
61000000-0000-0000-0000-000000000003	2026-05-19 01:07:31	2026-05-19 01:21:19	68.048935	649.5	129	1	-1	-91.35971	236.82661	3968.1382	249.81213	0.27240044	0
61000000-0000-0000-0000-000000000006	2026-05-19 01:42:54	2026-05-19 01:48:04	68.35235	844.68134	150.73187	0.52040815	0.6817765	0.510573	-5.51148	3.8382301	9.738286	6.365294	0.0066666603
61000000-0000-0000-0000-000000000006	2026-05-19 01:48:05	2026-05-19 01:55:00	67.29578	864.27203	148.67728	0.48232323	0.7138509	3.1102843	-2.9929698	5.2081885	9.808655	6.226101	0.7633333
61000000-0000-0000-0000-000000000006	2026-05-19 01:55:00	2026-05-19 02:04:16	68.41011	843.6112	144.04297	0.475	0.94677955	2.3892465	-4.339502	5.835706	9.806254	6.3306036	0
61000000-0000-0000-0000-000000000006	2026-05-19 02:04:16	2026-05-19 02:09:48	70.361115	730.4934	223.81445	0.56953645	1.1869214	2.8538098	-3.6048837	4.598297	9.933184	6.435556	0
61000000-0000-0000-0000-000000000006	2026-05-19 02:09:48	2026-05-19 02:15:00	74.49231	794.0837	182.32707	0.629771	0.8983349	0.4519663	-2.68433	7.6030164	9.916162	6.824039	0.7833333
61000000-0000-0000-0000-000000000006	2026-05-19 02:41:23	2026-05-19 02:46:56	66.296425	692.2782	203.1975	0.71659917	0.56773	3.1819258	-4.0652566	5.6331596	9.80984	6.13297	0.06666666
61000000-0000-0000-0000-000000000006	2026-05-19 02:46:56	2026-05-19 02:51:56	87.42548	576.7418	156.3879	0.4918033	0.73375154	-1.680431	-6.2964044	1.5930794	11.84861	6.8042755	0
61000000-0000-0000-0000-000000000006	2026-05-19 02:51:57	2026-05-19 02:57:17	70.90164	818.1145	101.50823	0.47058824	0.7777972	3.351394	-2.1171496	7.926988	9.878193	6.5177774	0.39
61000000-0000-0000-0000-000000000001	2026-05-17 23:57:03.275025	2026-05-18 00:02:02.275025	76.11230691049813	916.7668472198454	\N	23.956400998599516	0.826175636914775	0.04270229743712979	0.0031862188133570113	9.789972725990259	1.0103549833106504	72.7276367585352	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:37:03.275025	2026-05-17 18:42:02.275025	68.5320384721202	867.2945426209716	\N	20.61368736596904	1.56329667627576	0.003693176179907366	-0.017516967082134176	9.782620341920607	0.9822588311165665	78.06056371808246	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:47:03.275025	2026-05-17 23:52:02.275025	73.78287657970867	801.801642069221	\N	29.617742335293098	0.9805898190039088	0.04871486900780046	0.03632516064038656	9.828974510285743	0.959903081419389	67.16755489722179	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:37:03.275025	2026-05-17 20:42:02.275025	66.64515804088956	\N	\N	\N	1.7681438411081862	0.027568172834547627	0.047824059062373234	9.780460842753453	0.9762346242650757	69.83262400164925	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:22:03.275025	2026-05-17 19:27:02.275025	74.62088995579695	810.4127831255579	\N	18.300964425302734	1.2245840669739225	-0.01955874572871488	-0.028747248831245797	9.834082905025477	1.0004309922494037	79.48483025171257	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:07:03.275025	2026-05-17 23:12:02.275025	65.41983018001727	753.3542151229401	\N	33.81341466027871	1.307005803299977	-0.026519667580680608	0.03418871707205695	9.78022448945549	0.9918743947384564	75.42327766340874	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:12:03.275025	2026-05-17 19:17:02.275025	66.62630471319157	778.8832223203013	\N	28.757439365892733	1.2715708613656276	0.03435271836754923	0.008596353018375871	9.756211382977536	0.9662928211953001	77.25685352582394	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:17:03.275025	2026-05-17 22:22:02.275025	77.462945684134	757.4241442073625	\N	24.56741612496871	0.8706009875138105	-0.027968061225049204	-0.021031214644213404	9.758127965217703	1.0357718589886646	78.45487286033435	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:27:03.275025	2026-05-17 19:32:02.275025	79.49148215014027	754.0512447021287	\N	27.164084511890128	1.0826907713325755	0.007645174577281866	-0.035997238282346466	9.826380906632004	0.9725187031962245	68.50327005762612	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:27:03.275025	2026-05-17 21:32:02.275025	72.86727295462484	756.035344698238	\N	29.72078268919972	1.256030174060281	0.01323043154468126	-0.003920505866170029	9.848045607090253	1.0080330084284688	73.7625253416386	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:52:03.275025	2026-05-17 20:57:02.275025	69.52955026684116	761.508319002299	\N	30.65374198296062	\N	-0.007892281350470973	0.0071061829183717284	9.771740790712084	1.0493812370341193	67.57637181709275	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:12:03.275025	2026-05-17 18:17:02.275025	74.62113822668104	807.1922787156303	\N	23.450881100078785	0.9226125426701905	-0.002487441254345371	0.019404382639449477	9.794008381220852	1.008647277253326	72.02684857463915	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:42:03.275025	2026-05-17 20:47:02.275025	\N	845.9839837502343	\N	31.315667312675927	1.6335031981991097	\N	-0.009933983221030583	9.837312177200085	0.9649694715377042	76.04377038294217	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:32:03.275025	2026-05-17 20:37:02.275025	68.26539159702247	855.3401657833916	\N	31.2740057284466	1.6049859315854524	-0.012953104193096525	-0.017671556403534065	9.841856641345082	0.9985138835658501	73.42278499617825	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:02:03.275025	2026-05-17 21:07:02.275025	70.75939943772168	848.8733605888494	\N	20.18031103927699	0.8681893008520061	0.0036601433863778995	0.006584125117096093	9.798010960681639	0.9698275224897385	65.23802906627132	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:27:03.275025	2026-05-17 18:32:02.275025	79.80581934549289	847.0858970999031	\N	28.90297247181713	0.9675130401052738	-0.01774746331832116	0.04241163248038507	9.788746431467088	1.0092382582256465	78.25737775631424	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:17:03.275025	2026-05-17 23:22:02.275025	65.7229093578251	759.1600159954357	\N	19.57484433695943	1.360385049314336	0.009842565893868095	-0.00505815939657215	9.812766183648879	1.0406957376656487	68.61633110844694	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:52:03.275025	2026-05-17 21:57:02.275025	71.99004630090629	809.6548394340736	\N	32.98139593501507	1.0801372142446033	-0.047137290896473984	-0.031912026678568586	9.842370363175856	0.9907568342145532	72.78321167112246	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:27:03.275025	2026-05-17 22:32:02.275025	68.21312071239348	818.0797064824388	\N	33.161704672250096	1.7180001550129045	-0.03927209480393439	-0.03376085664389668	9.791838401094225	1.0026485252820756	66.9368986205166	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:17:03.275025	2026-05-17 18:22:02.275025	65.71355542970599	895.3313936311436	\N	17.248269750004944	1.7249998604047254	-0.028940104967966243	-0.04527904230313458	9.834844049089696	0.9740883826173541	75.18078054184312	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:17:03.275025	2026-05-17 21:22:02.275025	67.33267112462762	854.9931340277598	\N	29.259274352092515	0.8427534604059523	-0.0005648309313377453	0.008158613823892935	9.839229929195772	0.9570006355227588	69.4609787142565	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:47:03.275025	2026-05-17 19:52:02.275025	75.47869938961301	752.6352726187602	\N	26.60510265738589	0.9249877151624808	0.026457270771076333	0.03635727023654671	9.812233220498664	0.9828148976222266	72.458685763221	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:37:03.275025	2026-05-17 21:42:02.275025	74.78184399335532	932.2384791194484	\N	33.838131571667276	1.4172022371077873	0.02351823689306605	-0.03350054917197596	9.822680045784614	1.0395671609020445	78.08743908914997	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:07:03.275025	2026-05-17 21:12:02.275025	74.33549847455879	892.1759025336868	\N	32.726791017269505	1.6391531743920615	0.003433136944203684	0.03898008508870861	9.835908788919888	0.9943574690814899	75.78503196819035	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:32:03.275025	2026-05-17 18:37:02.275025	70.08062213701604	944.5371989396197	\N	19.643535687831854	1.0898949530811175	0.0160173743306338	-0.018249581673273556	9.842895445395966	0.9986394320718728	68.11498817820396	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:07:03.275025	2026-05-17 19:12:02.275025	77.0924718710715	867.2226953935552	\N	22.882247396650758	1.7621847050072281	-0.014211781301258573	-0.01780456991507571	9.81607053879383	0.9897021612449207	79.10141291556894	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:42:03.275025	2026-05-17 23:47:02.275025	68.39822626826174	817.0641915595257	\N	30.470225247302643	1.5357862563909859	-0.029573978313048734	-0.016856266015100062	9.761909458916234	0.970295904311779	76.12186614959894	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:52:03.275025	2026-05-17 18:57:02.275025	66.37363472275023	829.1575121123067	\N	34.89379558837497	1.6178977366036464	0.005831277883516159	0.0416432001109516	9.752764763296655	0.9732728726049643	72.13795320033348	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:07:03.275025	2026-05-17 20:12:02.275025	73.86134260402395	890.5543546549624	\N	16.95102786746365	1.667277551282392	-0.046655899081254074	-0.016102041896171593	9.839073100617043	1.0338857006166857	78.48161197399855	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:42:03.275025	2026-05-17 22:47:02.275025	68.31112964687986	863.3995269501546	\N	20.435880349068714	1.5028817363035336	0.03038579564355255	0.009633577127824866	9.766613757508022	0.9820991161670622	77.44278753031006	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:12:03.275025	2026-05-17 22:17:02.275025	72.48438877187576	886.4283662200445	\N	22.926614330517957	1.1487805645831755	0.018135631016347603	0.042878060974029505	9.820051951766155	1.0007098618088581	72.63153612332175	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:22:03.275025	2026-05-17 20:27:02.275025	\N	838.4173644385646	\N	32.69814173184073	1.0239964560931851	\N	0.045322336056174195	9.808370087666997	1.0082452171983494	77.58387348077507	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:17:03.275025	2026-05-17 19:22:02.275025	69.41322946831679	851.1565525708556	\N	30.229377247933122	0.9712559140335635	0.014957108565257074	-0.049736549446494416	9.83887803220355	0.9794040681019781	79.82340497543478	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:22:03.275025	2026-05-17 18:27:02.275025	72.89287912452781	851.9934192094809	\N	25.012566587903315	1.7568200733027621	0.003939086113694666	0.03620785911867208	9.764240971819289	0.985911189704786	71.14559215478653	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:27:03.275025	2026-05-17 20:32:02.275025	67.70938923626728	880.2924557142057	\N	32.849140338043945	\N	0.02819550615652193	-0.0345058400983318	9.7968311383527	1.0376759436344967	66.18147195395605	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:52:03.275025	2026-05-17 23:57:02.275025	65.31362009686106	850.5173446601325	\N	26.965193260686373	1.488395645788343	-0.04989815826870932	-0.0031629283137109415	9.76147350825195	0.9562729207120199	68.90716725682994	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:32:03.275025	2026-05-17 23:37:02.275025	65.11498643101277	880.2175501734341	\N	34.73043864060734	1.6731314655772642	-0.04884803627094858	-0.010192848611857742	9.752436479093184	0.9956819249516826	72.87375524351181	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:12:03.275025	2026-05-17 23:17:02.275025	65.79648495332464	773.3241496674741	\N	25.488142125559435	0.997435889256042	-0.021361612630583383	-0.02045969903825913	9.844671711476026	0.9559973538767809	71.38516711689209	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:02:03.275025	2026-05-17 23:07:02.275025	68.2669039522141	894.6628653251773	\N	24.13552854329393	1.1155646486869377	0.043487613042687695	-0.002087994515961908	9.849718425091035	1.0459456188410712	73.99602990416864	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:17:03.275025	2026-05-17 20:22:02.275025	74.00138723396962	879.6541874798932	\N	26.877968814481868	1.3661686290368489	-0.03265611209776956	0.01116358896850602	9.79100201055583	1.031634239523285	74.73593404406644	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:42:03.275025	2026-05-17 19:47:02.275025	74.54932735054842	\N	\N	15.681441475323204	1.6340330734699795	-0.016606351262237064	-0.007884200465743028	9.78600259090711	1.0306762430486291	74.60564495878569	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:22:03.275025	2026-05-17 21:27:02.275025	67.72394630436307	924.9333143740795	\N	28.06347358253875	0.9012166474903851	0.027177601475768864	0.047182101041050584	9.811231512697109	0.9690415132841984	70.17252797427486	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:37:03.275025	2026-05-17 22:42:02.275025	65.03234111016168	921.5737217914271	\N	20.568651614023953	1.096640542387847	0.031839254860328195	-0.0029112972132665713	9.77302111101927	0.9891367760891128	79.33294553722129	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:02:03.275025	2026-05-17 19:07:02.275025	71.5970383797247	818.8986108682238	\N	18.662733116744686	0.9757216603778862	0.04259219591360211	0.028025527609868983	9.78423399480586	0.9589669188614572	79.68076110463856	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:12:03.275025	2026-05-17 21:17:02.275025	77.21342457512002	756.1997497302388	\N	16.29710294960709	1.5688316814508942	-0.0005378361160728318	0.04919985933099469	9.800771907947697	1.0369143312300608	76.67411324715611	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:57:03.275025	2026-05-17 19:02:02.275025	66.24281398212699	859.1048110566799	\N	33.15485634141859	1.4664723989100048	-0.014276877079659148	-0.016050614742509683	9.784405695486756	0.956235969302743	77.41943079345086	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:57:03.275025	2026-05-17 21:02:02.275025	79.22402649333819	869.1051256140463	\N	22.709038206559473	1.2927456335422867	-0.03211165465980419	-0.013867059680634508	9.78361449554439	0.9920460157967573	76.5317568391004	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:02:03.275025	2026-05-17 20:07:02.275025	73.27512422881964	921.3130565022291	\N	26.652477995003125	1.3860061558981995	0.023205041803759666	0.04171670941025789	9.828043670311414	0.9950590375030796	76.80491136832381	0
61000000-0000-0000-0000-000000000001	2026-05-17 19:57:03.275025	2026-05-17 20:02:02.275025	75.15384288349134	754.0073824305231	\N	20.589739869214352	\N	0.03452104257532784	-0.0027931884712494998	9.764874849868917	0.9848164846864347	71.06689311315867	0
61000000-0000-0000-0000-000000000001	2026-05-17 20:47:03.275025	2026-05-17 20:52:02.275025	74.62098305008267	818.7022501752803	\N	27.054067856984002	0.8086668685605547	-0.03940760799957171	-0.029987169171678943	9.814315977798897	1.0257552457807024	66.91355309687924	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:02:03.275025	2026-05-17 22:07:02.275025	72.97478947510857	796.0081512668087	\N	18.82251780997903	1.3690906391090278	0.018170864072165657	0.03855509808492885	9.811444359153432	1.0481547028253628	71.88400805908485	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:42:03.275025	2026-05-17 18:47:02.275025	65.61199151296482	830.5531798281046	\N	26.213949499778508	1.0734903145820858	-0.017122707694631048	-0.019858925973456	9.77352515318205	0.9993038620252848	74.61167607354287	0
61000000-0000-0000-0000-000000000001	2026-05-17 18:47:03.275025	2026-05-17 18:52:02.275025	72.74143393462303	921.967745571638	\N	25.43856533131113	1.5931347799616684	-0.0021811956334849975	-0.027309186219501937	9.830214296595079	1.0061691267211978	74.09622494736328	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:47:03.275025	2026-05-17 21:52:02.275025	76.2706340314467	940.5487473498649	\N	27.342857343557263	1.4034801612714674	0.04126469519587839	-0.04264292253491573	9.779542225584994	1.0171358985192904	78.99932153370969	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:27:03.275025	2026-05-17 23:32:02.275025	65.18415403392143	771.9973082293152	\N	19.38478067143904	1.4362663851733892	-0.033081997791131884	0.0094322741254411	9.822589149770888	1.0489329663917861	74.19231661888902	0
61000000-0000-0000-0000-000000000001	2026-05-17 22:52:03.275025	2026-05-17 22:57:02.275025	72.32393369890366	793.2774314734068	\N	32.454432428546255	1.2769019169945548	0.033170706670143976	-0.02013884129827568	9.818893079590511	1.0047635277004374	74.60891705240338	0
61000000-0000-0000-0000-000000000001	2026-05-17 21:42:03.275025	2026-05-17 21:47:02.275025	76.79621518041955	933.6330153678323	\N	25.77631693906227	1.019777999401105	0.004124747631822842	-0.04164392598143976	9.751484305988646	0.9633218571054514	66.57538745563971	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:37:03.275025	2026-05-17 23:42:02.275025	76.4942652193128	920.9336451203609	\N	19.10792849832372	1.358602544334459	0.01886247520033199	0.006826156603110388	9.837558748564529	1.0121374117862327	67.7133962748953	0
61000000-0000-0000-0000-000000000001	2026-05-17 23:22:03.275025	2026-05-17 23:27:02.275025	68.90766070888071	918.3108789590262	\N	24.853179147752407	0.8984690523195169	0.028545839803395312	0.030278320840695594	9.787471656896582	1.0362491468486361	71.14786371462093	0
61000000-0000-0000-0000-000000000006	2026-05-19 02:57:17	2026-05-19 03:06:33	77.58021	734.9158	99.85398	0.39375	0.9000754	2.3465917	-4.01683	6.3825154	9.830669	7.1630116	0.023333311
61000000-0000-0000-0000-000000000006	2026-05-19 03:14:59	2026-05-19 03:20:34	76.0054	783.7342	82.68751	0.24873096	0.92922795	4.187562	-2.4345217	6.507125	9.847665	7.006614	0
61000000-0000-0000-0000-000000000006	2026-05-19 03:20:34	2026-05-19 03:27:19	78.554794	804.43964	104.95296	0.38256657	0.8008824	1.8328472	-4.571564	5.5543013	9.820429	7.2598596	0.5133333
61000000-0000-0000-0000-000000000006	2026-05-19 03:27:19	2026-05-19 03:35:00	73.024025	786.9863	109.585625	0.40039062	0.73659486	2.4684696	-4.2774916	6.368302	9.814162	6.752629	0
61000000-0000-0000-0000-000000000006	2026-05-19 03:35:00	2026-05-19 03:41:37	74.79074	805.5663	146.10516	0.6097561	0.9461415	2.2229805	-2.1344368	6.731116	9.923324	6.846885	0
61000000-0000-0000-0000-000000000006	2026-05-19 04:39:02	2026-05-19 04:44:03	71.125404	796.3648	225.54356	0.62931037	0.6648601	2.5228286	-3.5469518	7.0897417	9.863756	6.547036	0
61000000-0000-0000-0000-000000000006	2026-05-19 04:44:04	2026-05-19 04:54:07	71.42857	849.3788	155.41066	0.49196786	1.5721267	3.3962805	-2.2551181	4.889149	9.8278885	6.596722	0.93
61000000-0000-0000-0000-000000000006	2026-05-19 04:54:07	2026-05-19 05:02:05	70.41418	798.4644	104.78082	0.37945494	1.459125	0.35572368	-5.626006	5.2509713	9.801302	6.5190454	0
61000000-0000-0000-0000-000000000006	2026-05-19 09:54:53	2026-05-19 10:00:02	86.41428	701.12305	143.05626	0.515625	0.4067177	2.2113583	-5.2416363	2.7015939	9.738727	8.046977	0.76666665
61000000-0000-0000-0000-000000000006	2026-05-19 10:00:02	2026-05-19 10:05:32	86.74104	712.98694	162.89664	0.4262295	1.7000872	3.310084	-4.817515	4.0449734	9.759157	8.062067	0
61000000-0000-0000-0000-000000000006	2026-05-19 10:11:07	2026-05-19 10:16:45	82.95425	717.561	67.779236	0.25	0.17448254	-0.28477967	-5.942379	0.49944797	9.697556	7.7545047	0
61000000-0000-0000-0000-000000000006	2026-05-19 10:16:45	2026-05-19 10:22:25	84.934715	709.98285	149.78978	0.38968483	0.5139947	-3.0211437	-4.5850034	0.8879387	9.775972	7.8818607	0
61000000-0000-0000-0000-000000000006	2026-05-19 10:39:14	2026-05-19 10:44:52	79.62334	724.00385	174.32675	0.59302324	0.7072154	2.009439	-1.8636762	6.9798226	9.914815	7.294978	0
61000000-0000-0000-0000-000000000006	2026-05-19 10:52:43	2026-05-19 10:59:50	78.34611	773.5337	210.81146	0.575985	1.5179574	1.939131	-3.2313964	6.1172113	9.834389	7.231244	0
61000000-0000-0000-0000-000000000006	2026-05-19 11:07:25	2026-05-19 11:14:23	84.947365	582	174.35818	0.7777778	-1	0.52503985	0.0804811	8.865431	9.950313	7.757529	0.87333333
61000000-0000-0000-0000-000000000006	2026-05-19 11:14:23	2026-05-19 11:19:51	74.582855	800.8366	132.29015	0.50282484	0.6879091	3.9383888	-1.4413035	5.880212	9.863238	6.865619	0
61000000-0000-0000-0000-000000000006	2026-05-19 11:19:51	2026-05-19 11:25:12	79.20488	741.8071	137.49756	0.5102041	0.55090576	2.0670946	-0.70274335	7.257366	9.928122	7.2478037	0.31666666
61000000-0000-0000-0000-000000000006	2026-05-19 12:25:12	2026-05-19 12:30:21	82.542854	775.5	193	1	-1	0.7708795	-0.204192	9.787197	9.941696	7.543881	0.8833333
61000000-0000-0000-0000-000000000006	2026-05-19 12:30:21	2026-05-19 12:35:56	85.01967	705.5157	154.43317	0.47902098	0.7331801	3.047041	-2.1061633	7.941607	9.892181	7.8055687	0
61000000-0000-0000-0000-000000000006	2026-05-19 12:35:56	2026-05-19 12:41:16	85.3218	704.5728	85.601234	0.2761905	0.5136411	3.5753748	-2.0574815	4.4772315	9.85017	7.863637	0.03666669
61000000-0000-0000-0000-000000000006	2026-05-19 12:41:16	2026-05-19 12:46:51	82.30699	729.90234	112.63865	0.32344213	1.3398573	2.0160413	-1.7742912	8.560202	9.906279	7.546753	0
61000000-0000-0000-0000-000000000006	2026-05-19 12:46:51	2026-05-19 12:52:24	85.61682	723.5126	155.7313	0.42424244	1.0359756	2.5021489	-1.1113951	5.563196	9.88715	7.864025	0.2866667
61000000-0000-0000-0000-000000000006	2026-05-19 13:07:15	2026-05-19 13:14:43	82.54457	740.95953	133.698	0.4016227	0.6641841	-0.25618187	-2.2488022	5.076443	9.870896	7.5931706	0
61000000-0000-0000-0000-000000000006	2026-05-19 13:14:43	2026-05-19 13:20:50	81.47012	745.48047	180.8938	0.57865167	1.4348717	1.0169522	-0.8556923	5.7545815	9.921656	7.459503	0.16333336
61000000-0000-0000-0000-000000000006	2026-05-19 13:20:50	2026-05-19 13:28:06	83.00237	738.8863	120.19555	0.33255813	0.6725194	-2.6985424	-2.8940542	3.1939259	10.020984	7.5313034	0
61000000-0000-0000-0000-000000000006	2026-05-19 13:28:06	2026-05-19 13:34:19	104.35507	686.6972	306.56537	0.82978725	1.5612282	-2.1648998	-4.7908683	0.9267488	10.337199	9.20466	0.07999998
61000000-0000-0000-0000-000000000006	2026-05-19 13:34:19	2026-05-19 13:41:58	88.93171	849	0	0	-1	1.1905214	-5.8277483	3.04137	9.792658	8.24002	0
61000000-0000-0000-0000-000000000003	2026-05-19 14:22:14	2026-05-19 14:30:03	82.612015	730.8044	172.77586	0.5670103	0.88925195	1.9420958	-7.799495	2.157088	9.635789	7.767361	0
61000000-0000-0000-0000-000000000003	2026-05-19 14:30:03	2026-05-19 14:36:25	80.12734	732.7069	136.64569	0.550173	0.94161713	1.1197926	-4.522743	5.8543797	9.770796	7.439315	0.110000014
61000000-0000-0000-0000-000000000003	2026-05-19 14:35:00	2026-05-19 14:40:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-19 14:40:00	2026-05-19 14:45:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-19 14:45:00	2026-05-19 14:50:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-01 00:00:00	2026-05-01 23:59:59	81	740.96	133.7	0.4016	0.6642	-0.2562	-2.2488	5.0764	9.8709	7.5932	0
61000000-0000-0000-0000-000000000003	2026-05-02 00:00:00	2026-05-02 23:59:59	82	729.9	112.64	0.3234	1.3399	2.016	-1.7743	8.5602	9.9063	7.5468	0
61000000-0000-0000-0000-000000000003	2026-05-03 00:00:00	2026-05-03 23:59:59	81	745.48	180.89	0.5787	1.4349	1.017	-0.8557	5.7546	9.9217	7.4595	0.1633
61000000-0000-0000-0000-000000000003	2026-05-04 00:00:00	2026-05-04 23:59:59	83	723.51	155.73	0.4242	1.036	2.5021	-1.1114	5.5632	9.8872	7.864	0.2867
61000000-0000-0000-0000-000000000003	2026-05-05 00:00:00	2026-05-05 23:59:59	82	738.89	120.2	0.3326	0.6725	-2.6985	-2.8941	3.1939	10.021	7.5313	0
61000000-0000-0000-0000-000000000003	2026-05-06 00:00:00	2026-05-06 23:59:59	87	686.7	306.57	0.8298	1.5612	-2.1649	-4.7909	0.9267	10.3372	9.2047	0.08
61000000-0000-0000-0000-000000000003	2026-05-07 00:00:00	2026-05-07 23:59:59	75	800.84	132.29	0.5028	0.6879	3.9384	-1.4413	5.8802	9.8632	6.8656	0
61000000-0000-0000-0000-000000000003	2026-05-08 00:00:00	2026-05-08 23:59:59	77	775.5	193	1	-1	0.7709	-0.2042	9.7872	9.9417	7.5439	0.8833
61000000-0000-0000-0000-000000000003	2026-05-09 00:00:00	2026-05-09 23:59:59	85	705.52	154.43	0.479	0.7332	3.047	-2.1062	7.9416	9.8922	7.8056	0
61000000-0000-0000-0000-000000000003	2026-05-10 00:00:00	2026-05-10 23:59:59	85	704.57	85.6	0.2762	0.5136	3.5754	-2.0575	4.4772	9.8502	7.8636	0.0367
61000000-0000-0000-0000-000000000003	2026-05-11 00:00:00	2026-05-11 23:59:59	81	741.81	137.5	0.5102	0.5509	2.0671	-0.7027	7.2574	9.9281	7.2478	0.3167
61000000-0000-0000-0000-000000000003	2026-05-12 00:00:00	2026-05-12 23:59:59	82	582	174.36	0.7778	-1	0.525	0.0805	8.8654	9.9503	7.7575	0.8733
61000000-0000-0000-0000-000000000003	2026-05-13 00:00:00	2026-05-13 23:59:59	78	773.53	210.81	0.576	1.518	1.9391	-3.2314	6.1172	9.8344	7.2312	0
61000000-0000-0000-0000-000000000003	2026-05-14 00:00:00	2026-05-14 23:59:59	83	724	174.33	0.593	0.7072	2.0094	-1.8637	6.9798	9.9148	7.295	0
61000000-0000-0000-0000-000000000003	2026-05-15 00:00:00	2026-05-15 23:59:59	85	709.98	149.79	0.3897	0.514	-3.0211	-4.585	0.8879	9.776	7.8819	0
61000000-0000-0000-0000-000000000003	2026-05-16 00:00:00	2026-05-16 23:59:59	80	752.34	168.45	0.451	1.123	1.582	-2.341	4.213	9.821	7.612	0.07
61000000-0000-0000-0000-000000000003	2026-05-17 00:00:00	2026-05-17 23:59:59	84	718.21	142.67	0.362	0.885	-1.453	-1.922	6.335	9.883	7.724	0
61000000-0000-0000-0000-000000000003	2026-05-18 00:00:00	2026-05-18 23:59:59	79	763.45	220.12	0.618	1.178	2.851	-0.583	5.421	9.904	7.322	0.18
61000000-0000-0000-0000-000000000003	2026-05-19 00:00:00	2026-05-19 23:59:59	82	731.02	161.34	0.443	0.951	0.622	-3.452	7.122	9.851	7.641	0.03
61000000-0000-0000-0000-000000000003	2026-05-19 14:50:00	2026-05-19 14:55:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000006	2026-05-19 18:38:03	2026-05-19 18:45:42	103	0	0	0	-1	1.1270798	-1.4311142	7.836744	9.915731	9.435923	0.99333334
61000000-0000-0000-0000-000000000006	2026-05-19 18:45:42	2026-05-19 18:53:43	65.50944	0	0	0	-1	3.5022216	-7.2967715	5.2466974	9.645764	6.1535683	0
61000000-0000-0000-0000-000000000006	2026-05-19 18:53:43	2026-05-19 19:01:45	62.10386	972.4352	64.13376	0.41618496	0.41332945	3.444534	-7.359952	4.915527	9.642533	5.8354397	0
61000000-0000-0000-0000-000000000006	2026-05-19 20:50:13	2026-05-19 20:57:38	72.7889	791.12177	197.8846	0.66494846	0.7968074	0.52846646	-4.703659	6.456641	9.823879	6.7248445	0
61000000-0000-0000-0000-000000000006	2026-05-19 20:57:38	2026-05-19 21:05:38	74.073944	769.7091	196.89043	0.64777327	0.66001964	-1.372709	-5.08576	6.1855145	9.842321	6.831927	0
61000000-0000-0000-0000-000000000006	2026-05-19 21:05:38	2026-05-19 21:13:15	71.63934	805.6811	163.77765	0.55333334	1.53378	-1.0367891	-3.8258739	4.284951	9.901052	6.571782	0
61000000-0000-0000-0000-000000000006	2026-05-19 21:13:15	2026-05-19 21:20:47	78.38178	753.64746	132.39162	0.46503496	0.8121682	3.122462	-6.865528	2.74146	9.690638	7.3318157	0
61000000-0000-0000-0000-000000000006	2026-05-19 21:52:29	2026-05-19 22:00:19	77.97685	769.8311	120.44809	0.4766147	0.6175168	1.4353445	-3.6035433	6.594716	9.854575	7.1837773	0
61000000-0000-0000-0000-000000000006	2026-05-19 22:00:19	2026-05-19 22:07:55	78.121216	756.96106	150.19522	0.52117264	1.0428969	-2.1181185	-3.608353	6.4655266	9.867111	7.188775	0
61000000-0000-0000-0000-000000000006	2026-05-19 22:07:55	2026-05-19 22:15:30	78.24071	744.50836	174.84583	0.6245353	1.7474827	0.9513024	-3.7380705	6.2177663	9.85101	7.2104535	0
61000000-0000-0000-0000-000000000006	2026-05-19 22:15:30	2026-05-19 22:23:19	75.55454	774.9459	114.83293	0.41734418	1.0647601	2.2275584	-3.573608	4.7908287	9.839149	6.9705234	0
61000000-0000-0000-0000-000000000006	2026-05-19 23:24:01	2026-05-19 23:30:27	78.85014	770.8442	143.55882	0.55965906	1.0716478	-1.8030274	-3.0544345	6.4606113	10.062968	7.1273947	0
61000000-0000-0000-0000-000000000006	2026-05-19 23:30:27	2026-05-19 23:37:59	76.1242	777.2461	123.073906	0.5029354	0.81962746	-0.3521995	-2.9408019	4.7465444	9.955512	6.948484	0
61000000-0000-0000-0000-000000000006	2026-05-19 23:37:59	2026-05-19 23:44:43	69.12363	851.2087	121.23917	0.5652174	0.78646797	0.89536136	-0.81861395	7.994044	9.946685	6.314572	0
61000000-0000-0000-0000-000000000006	2026-05-19 23:44:43	2026-05-19 23:52:19	68.74354	866.8953	105.50064	0.44271845	1.7932994	0.08450049	0.9077857	8.662919	10.018542	6.238896	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:30:00	2026-05-20 15:35:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:35:00	2026-05-20 15:40:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:40:00	2026-05-20 15:45:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:45:00	2026-05-20 15:50:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:50:00	2026-05-20 15:55:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 15:55:00	2026-05-20 16:00:00	180	0.33	5	80	6	0	0	25	25	80	0
61000000-0000-0000-0000-000000000003	2026-05-20 16:00:00	2026-05-20 16:05:00	180	0.33	5	80	6	0	0	25	25	80	0
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init biometric schema	SQL	V1__init_biometric_schema.sql	-326276289	rebloom	2026-05-15 13:17:45.707513	114	t
2	1.1	biometric schema	SQL	V1.1__biometric_schema.sql	640051228	rebloom	2026-05-15 13:17:45.989728	34	t
3	1.2	biometric schema	SQL	V1.2__biometric_schema.sql	48065889	rebloom	2026-05-15 13:17:46.086796	78	t
4	2	biometric schema	SQL	V2__biometric_schema.sql	-1785667161	rebloom	2026-05-15 13:17:46.20882	58	t
5	2.1	bimoetric schema	SQL	V2.1__bimoetric_schema.sql	949871639	rebloom	2026-05-15 13:17:46.308656	33	t
6	2.2	update sleep schema	SQL	V2.2__update_sleep_schema.sql	-660886047	rebloom	2026-05-15 13:17:46.365878	24	t
\.


--
-- Data for Name: phq_results; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.phq_results (id, user_id, date, result, score, predicted_at) FROM stdin;
1	61000000-0000-0000-0000-000000000001	2026-05-01	0	30	2026-05-01 21:00:00
3	61000000-0000-0000-0000-000000000003	2026-05-08	0	13	2026-05-08 21:05:00
4	61000000-0000-0000-0000-000000000003	2026-05-09	1	36	2026-05-09 09:05:00
11	61000000-0000-0000-0000-000000000003	2026-05-16	1	80	2026-05-16 09:04:00
12	61000000-0000-0000-0000-000000000003	2026-05-17	1	65	2026-05-17 09:05:00
13	61000000-0000-0000-0000-000000000003	2026-05-18	1	44	2026-05-18 09:03:00
14	61000000-0000-0000-0000-000000000003	2026-05-19	1	90	2026-05-19 09:02:00
2	61000000-0000-0000-0000-000000000002	2026-05-07	1	60	2026-05-08 21:00:00
5	61000000-0000-0000-0000-000000000003	2026-05-10	0	29	2026-05-10 09:04:00
6	61000000-0000-0000-0000-000000000003	2026-05-11	0	31	2026-05-11 09:03:00
7	61000000-0000-0000-0000-000000000003	2026-05-12	0	32	2026-05-12 09:02:00
8	61000000-0000-0000-0000-000000000003	2026-05-13	0	33	2026-05-13 09:04:00
9	61000000-0000-0000-0000-000000000003	2026-05-14	0	31	2026-05-14 09:05:00
10	61000000-0000-0000-0000-000000000003	2026-05-15	0	29	2026-05-15 09:02:00
15	61000000-0000-0000-0000-000000000003	2026-05-20	1	50	2026-05-20 09:03:00
16	61000000-0000-0000-0000-000000000003	2026-05-02	0	29	2026-05-02 09:04:00
17	61000000-0000-0000-0000-000000000003	2026-05-03	0	31	2026-05-03 09:03:00
18	61000000-0000-0000-0000-000000000003	2026-05-04	0	32	2026-05-04 09:02:00
19	61000000-0000-0000-0000-000000000003	2026-05-05	1	36	2026-05-05 09:04:00
20	61000000-0000-0000-0000-000000000003	2026-05-06	1	42	2026-05-06 09:04:00
\.


--
-- Data for Name: sleeps; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.sleeps (user_id, asleep, wakeup, sleep_duration, waso, sleep_score, sleep_efficiency, is_main_sleep) FROM stdin;
61000000-0000-0000-0000-000000000001	2026-05-06 22:35:00	2026-05-07 07:00:00	505	22	84.5	91	t
61000000-0000-0000-0000-000000000002	2026-05-06 22:20:00	2026-05-07 07:10:00	530	18	88	93.2	t
61000000-0000-0000-0000-000000000003	2026-05-06 22:50:00	2026-05-07 06:55:00	485	30	78	87.5	t
61000000-0000-0000-0000-000000000003	2026-04-30 23:05:00	2026-05-01 07:15:00	471.5	18.5	82	88	t
61000000-0000-0000-0000-000000000003	2026-05-01 22:50:00	2026-05-02 06:45:00	453	22	78	85	t
61000000-0000-0000-0000-000000000003	2026-05-02 23:20:00	2026-05-03 07:30:00	475	15	85	91	t
61000000-0000-0000-0000-000000000003	2026-05-03 23:45:00	2026-05-04 08:00:00	465	30	72	82	t
61000000-0000-0000-0000-000000000003	2026-05-04 22:55:00	2026-05-05 07:10:00	483	12	88	93	t
61000000-0000-0000-0000-000000000003	2026-05-05 23:30:00	2026-05-06 07:45:00	475	20	80	87	t
61000000-0000-0000-0000-000000000003	2026-05-06 23:10:00	2026-05-07 08:15:00	520	25	76	84	t
61000000-0000-0000-0000-000000000003	2026-05-07 22:40:00	2026-05-08 06:55:00	477	18	83	89	t
61000000-0000-0000-0000-000000000003	2026-05-08 23:00:00	2026-05-09 07:20:00	486	14	86	92	t
61000000-0000-0000-0000-000000000003	2026-05-09 23:15:00	2026-05-10 07:00:00	437	28	74	83	t
61000000-0000-0000-0000-000000000003	2026-05-10 23:50:00	2026-05-11 08:30:00	485	35	70	80	t
61000000-0000-0000-0000-000000000003	2026-05-11 23:05:00	2026-05-12 07:25:00	484	16	84	90	t
61000000-0000-0000-0000-000000000003	2026-05-12 22:45:00	2026-05-13 06:50:00	465	20	81	87	t
61000000-0000-0000-0000-000000000003	2026-05-13 23:20:00	2026-05-14 07:35:00	473	22	79	86	t
61000000-0000-0000-0000-000000000003	2026-05-14 23:40:00	2026-05-15 08:05:00	475	30	75	83	t
61000000-0000-0000-0000-000000000003	2026-05-15 23:10:00	2026-05-16 07:15:00	467	18	82	88	t
61000000-0000-0000-0000-000000000003	2026-05-16 22:55:00	2026-05-17 07:00:00	470	15	87	92	t
61000000-0000-0000-0000-000000000003	2026-05-17 23:25:00	2026-05-18 07:40:00	470	25	77	85	t
61000000-0000-0000-0000-000000000003	2026-05-18 23:00:00	2026-05-19 07:10:00	476	14	83	88	t
\.


--
-- Name: anomalies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.anomalies_id_seq', 90, true);


--
-- Name: phq_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.phq_results_id_seq', 3, true);


--
-- Name: anomalies anomalies_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.anomalies
    ADD CONSTRAINT anomalies_pkey PRIMARY KEY (id);


--
-- Name: biometrics biometrics_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.biometrics
    ADD CONSTRAINT biometrics_pkey PRIMARY KEY (user_id, ts_start);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: phq_results phq_results_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.phq_results
    ADD CONSTRAINT phq_results_pkey PRIMARY KEY (id);


--
-- Name: sleeps sleeps_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.sleeps
    ADD CONSTRAINT sleeps_pkey PRIMARY KEY (user_id, wakeup);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_anomaly_children_ts; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_anomaly_children_ts ON public.anomalies USING btree (user_id, ts_start DESC);


--
-- Name: idx_phq_user_date; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_phq_user_date ON public.phq_results USING btree (user_id, date DESC);


--
-- PostgreSQL database dump complete
--

\unrestrict 5ObXdNpeGKstEBdQelj5WNaklRjJCq1bSSlkNuoa9ILRQbKie3gyfXOB6ncSAbH

--
-- Database "rebloom_notification" dump
--

--
-- PostgreSQL database dump
--

\restrict tBEQ51FFsbwpl9b90Aoah5qjAPcA1fCgSLxpIEQng2hKxrtstgFviSsXa4pYb7N

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rebloom_notification; Type: DATABASE; Schema: -; Owner: rebloom
--

CREATE DATABASE rebloom_notification WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rebloom_notification OWNER TO rebloom;

\unrestrict tBEQ51FFsbwpl9b90Aoah5qjAPcA1fCgSLxpIEQng2hKxrtstgFviSsXa4pYb7N
\connect rebloom_notification
\restrict tBEQ51FFsbwpl9b90Aoah5qjAPcA1fCgSLxpIEQng2hKxrtstgFviSsXa4pYb7N

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: delivery_status; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.delivery_status AS ENUM (
    'PENDING',
    'SENT',
    'FAILED'
);


ALTER TYPE public.delivery_status OWNER TO rebloom;

--
-- Name: schedule_day; Type: TYPE; Schema: public; Owner: rebloom
--

CREATE TYPE public.schedule_day AS ENUM (
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY'
);


ALTER TYPE public.schedule_day OWNER TO rebloom;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO rebloom;

--
-- Name: notification_schedules; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.notification_schedules (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    notification_type_id bigint NOT NULL,
    day public.schedule_day NOT NULL,
    "time" time without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notification_schedules OWNER TO rebloom;

--
-- Name: notification_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.notification_schedules ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.notification_settings (
    id bigint NOT NULL,
    user_id uuid,
    is_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notification_settings OWNER TO rebloom;

--
-- Name: notification_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.notification_settings ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notification_types; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.notification_types (
    id bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.notification_types OWNER TO rebloom;

--
-- Name: notification_types_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.notification_types ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notification_types_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    receiver_id uuid NOT NULL,
    notification_type_id bigint NOT NULL,
    payload jsonb NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    delivery_status public.delivery_status DEFAULT 'PENDING'::public.delivery_status NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO rebloom;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.notifications ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_fcm_tokens; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.user_fcm_tokens (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    fcm_token character varying(512) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL
);


ALTER TABLE public.user_fcm_tokens OWNER TO rebloom;

--
-- Name: user_fcm_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.user_fcm_tokens ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.user_fcm_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init notification schema	SQL	V1__init_notification_schema.sql	55014738	rebloom	2026-05-15 12:51:19.133261	65	t
2	1.1	notification schema	SQL	V1.1__notification_schema.sql	431254472	rebloom	2026-05-15 12:51:19.26767	37	t
3	2	notification schema	SQL	V2__notification_schema.sql	1705122646	rebloom	2026-05-15 12:51:19.345264	159	t
\.


--
-- Data for Name: notification_schedules; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.notification_schedules (id, user_id, notification_type_id, day, "time", created_at, modified_at) FROM stdin;
6	62000000-0000-0000-0000-000000000003	5	FRIDAY	21:10:00	2026-05-01 09:05:00	2026-05-01 09:05:00
5	62000000-0000-0000-0000-000000000002	5	FRIDAY	21:05:00	2026-05-01 09:04:00	2026-05-01 09:04:00
4	62000000-0000-0000-0000-000000000001	5	FRIDAY	21:00:00	2026-05-01 09:03:00	2026-05-01 09:03:00
2	61000000-0000-0000-0000-000000000002	7	TUESDAY	20:30:00	2026-05-01 09:01:00	2026-05-01 09:01:00
1	61000000-0000-0000-0000-000000000001	7	MONDAY	20:30:00	2026-05-01 09:00:00	2026-05-01 09:00:00
8	61000000-0000-0000-0000-000000000003	7	WEDNESDAY	20:30:00	2026-05-19 14:08:55.084622	2026-05-19 14:08:55.084622
\.


--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.notification_settings (id, user_id, is_enabled, created_at, modified_at) FROM stdin;
1	61000000-0000-0000-0000-000000000001	t	2026-05-01 09:00:00	2026-05-01 09:00:00
2	61000000-0000-0000-0000-000000000002	t	2026-05-01 09:01:00	2026-05-01 09:01:00
4	62000000-0000-0000-0000-000000000001	t	2026-05-01 09:03:00	2026-05-01 09:03:00
5	62000000-0000-0000-0000-000000000002	t	2026-05-01 09:04:00	2026-05-01 09:04:00
6	62000000-0000-0000-0000-000000000003	t	2026-05-01 09:05:00	2026-05-01 09:05:00
7	63000000-0000-0000-0000-000000000001	t	2026-05-01 09:06:00	2026-05-01 09:06:00
8	63000000-0000-0000-0000-000000000002	t	2026-05-01 09:07:00	2026-05-01 09:07:00
9	63000000-0000-0000-0000-000000000003	t	2026-05-01 09:08:00	2026-05-01 09:08:00
3	61000000-0000-0000-0000-000000000003	t	2026-05-01 09:02:00	2026-05-19 14:08:55.1018
\.


--
-- Data for Name: notification_types; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.notification_types (id, name) FROM stdin;
1	RISK_ALERT
2	CONVERSATION_ALERT
3	DIARY_REPORT
4	CONVERSATION_REPORT
5	PARENT_REPORT_NEW
6	PARENT_REPORT_REPLY
7	DIARY_REMINDER
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.notifications (id, receiver_id, notification_type_id, payload, is_read, delivery_status, created_at, modified_at) FROM stdin;
13	63000000-0000-0000-0000-000000000001	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "counselorName": "Counselor One", "childrenReportId": "bbebd5f6-699f-4cf2-9e6c-0acd5b51bdba"}	t	SENT	2026-05-17 22:00:33.15546	2026-05-17 22:00:40.74665
69	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-19 16:06:25.6133	2026-05-20 14:13:54.763894
73	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작하지 못했어요", "content": "자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 15:27:12.193227	2026-05-20 15:27:13.920916
7	62000000-0000-0000-0000-000000000001	6	{"title": "상담사 댓글이 등록되었습니다", "content": "작성한 부모 리포트에 상담사 댓글이 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "childrenReportId": "7cf1277c-4ae9-446f-8cdd-8651f485588b"}	t	SENT	2026-05-16 21:14:06.316375	2026-05-17 20:21:22.734274
6	61000000-0000-0000-0000-000000000003	7	{"title": "Diary time", "content": "Write a short note about today before bed."}	t	SENT	2026-05-07 20:30:00	2026-05-07 20:30:00
10	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 주경이에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "주경"}	t	SENT	2026-05-17 15:35:22.07	2026-05-17 20:21:42.398688
19	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 20:14:59.934312	2026-05-18 23:09:16.689513
1	62000000-0000-0000-0000-000000000001	5	{"title": "Weekly report ready", "content": "Child One weekly report was created.", "childrenId": "61000000-0000-0000-0000-000000000001"}	t	SENT	2026-05-07 21:00:00	2026-05-17 21:27:04.40883
8	62000000-0000-0000-0000-000000000001	6	{"title": "상담사 댓글이 등록되었습니다", "content": "작성한 부모 리포트에 상담사 댓글이 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "childrenReportId": "fb229f41-b699-4691-8d67-9e1c8ca19afa"}	t	SENT	2026-05-17 14:42:01.576754	2026-05-17 21:27:05.277702
9	63000000-0000-0000-0000-000000000001	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "counselorName": "Counselor One", "childrenReportId": "e16d28a4-08ef-46f4-a60c-410de5d107c4"}	t	SENT	2026-05-17 15:35:22.07	2026-05-17 20:54:06.184146
11	63000000-0000-0000-0000-000000000001	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "counselorName": "Counselor One", "childrenReportId": "1e5db996-235d-4eb1-af1b-1dee336d6f0d"}	t	SENT	2026-05-17 20:25:28.968601	2026-05-17 20:54:06.18234
12	63000000-0000-0000-0000-000000000001	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "counselorName": "Counselor One", "childrenReportId": "7d981272-13a3-4eb2-b055-352029e68235"}	t	SENT	2026-05-17 20:56:49.652214	2026-05-17 21:30:53.831586
14	63000000-0000-0000-0000-000000000001	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "counselorId": "63000000-0000-0000-0000-000000000001", "counselorName": "Counselor One", "childrenReportId": "aeb9793b-f03e-4b9f-ad42-4d6fbc36bd0a"}	t	SENT	2026-05-17 22:01:00.233212	2026-05-17 22:01:43.511693
4	63000000-0000-0000-0000-000000000001	1	{"title": "Risk signal detected", "content": "Child One anomaly signal was detected.", "childrenId": "61000000-0000-0000-0000-000000000001"}	f	PENDING	2026-05-07 08:16:00	2026-05-07 08:16:00
5	63000000-0000-0000-0000-000000000002	1	{"title": "Risk signal detected", "content": "Child Two anomaly signal needs review.", "childrenId": "61000000-0000-0000-0000-000000000002"}	f	PENDING	2026-05-07 08:17:00	2026-05-07 08:17:00
2	62000000-0000-0000-0000-000000000002	5	{"title": "Weekly report ready", "content": "Child Two weekly report was created.", "childrenId": "61000000-0000-0000-0000-000000000002"}	f	SENT	2026-05-07 21:05:00	2026-05-07 21:05:00
20	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 20:20:00.03844	2026-05-18 23:09:17.046014
15	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 19:53:32.586892	2026-05-18 19:53:32.840384
21	61000000-0000-0000-0000-000000000001	7	{"title": "일기 작성 시간이에요", "content": "오늘의 마음을 기록해볼까요?", "childrenId": "61000000-0000-0000-0000-000000000001"}	f	SENT	2026-05-18 20:30:00.031677	2026-05-18 20:30:01.353442
18	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 20:09:55.480916	2026-05-18 23:09:15.579338
3	62000000-0000-0000-0000-000000000003	5	{"title": "Weekly report ready", "content": "Child Three weekly report was created.", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-07 21:10:00	2026-05-07 21:10:00
39	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-19 00:21:51.639719	2026-05-19 00:29:17.975692
70	61000000-0000-0000-0000-000000000002	7	{"title": "일기 작성 시간이에요", "content": "오늘의 마음을 기록해볼까요?", "childrenId": "61000000-0000-0000-0000-000000000002"}	f	FAILED	2026-05-19 20:30:00.12663	2026-05-19 20:30:00.297538
33	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 23:08:23.278212	2026-05-18 23:08:23.299851
30	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 22:58:05.005618	2026-05-18 22:58:05.023228
78	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 유주경에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "유주경", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-20 16:45:36.738791	2026-05-20 16:46:00.891351
31	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 23:03:23.198541	2026-05-18 23:03:23.236567
37	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 23:53:23.490042	2026-05-18 23:53:23.517526
74	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 15:27:42.107808	2026-05-20 15:27:42.267226
79	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 유주경에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "유주경", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-20 16:49:02.134444	2026-05-20 16:49:06.477309
27	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	FAILED	2026-05-18 22:37:52.870405	2026-05-18 22:40:12.476165
81	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 유주경에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "유주경", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-20 16:50:07.822034	2026-05-20 16:50:11.795653
36	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 23:48:08.289811	2026-05-18 23:48:08.318077
80	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 16:49:07.384955	2026-05-20 16:49:07.410285
28	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 22:42:22.970237	2026-05-18 23:09:17.695422
26	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 22:37:20.738614	2026-05-18 23:09:18.121137
29	62000000-0000-0000-0000-000000000001	1	{"title": "주의 필요", "content": "지금 한번 Child One에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000001", "childrenId": "61000000-0000-0000-0000-000000000001", "childrenName": "Child One", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 22:47:23.051275	2026-05-18 23:09:18.445708
32	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	FAILED	2026-05-18 23:04:51.285993	2026-05-18 23:13:45.379415
22	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 21:47:40.009257	2026-05-18 21:47:40.13042
38	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 23:58:23.572437	2026-05-18 23:58:23.624193
17	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 20:03:59.573226	2026-05-18 20:03:59.609955
16	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 19:58:59.471367	2026-05-18 19:58:59.50777
24	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 21:58:03.50472	2026-05-18 21:58:03.526728
34	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작하지 못했어요", "content": "자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-18 23:31:29.508269	2026-05-18 23:31:29.548694
25	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 22:32:32.92038	2026-05-18 22:32:33.029618
35	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작하지 못했어요", "content": "자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-18 23:36:45.63034	2026-05-18 23:36:45.657259
43	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	SENT	2026-05-19 01:12:40.698424	2026-05-19 01:12:40.731637
40	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작하지 못했어요", "content": "자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-19 00:26:59.286736	2026-05-19 00:29:30.893211
71	63000000-0000-0000-0000-000000000003	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "counselorName": "마동석", "childrenReportId": "afc80d6e-e551-4084-80a5-e22e13d5a5c9"}	f	SENT	2026-05-20 14:13:33.126085	2026-05-20 14:13:33.434245
44	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	SENT	2026-05-19 01:17:40.775724	2026-05-19 01:17:40.811009
41	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-19 00:43:11.337446	2026-05-19 00:43:41.392481
75	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 15:28:30.95372	2026-05-20 15:48:03.304552
23	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-18 21:53:03.378402	2026-05-19 00:57:31.344001
82	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 16:50:13.534425	2026-05-20 16:50:13.562752
84	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작하지 못했어요", "content": "자녀의 현재 위치가 집이 아닌 것으로 확인되어 AIoT 대화를 시작하지 않았습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	f	SENT	2026-05-20 22:12:26.756249	2026-05-20 22:12:27.239562
42	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	SENT	2026-05-19 01:07:33.423124	2026-05-19 01:07:33.462636
47	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 01:58:10.993764	2026-05-19 01:58:11.031597
45	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 01:48:07.554012	2026-05-19 01:48:07.581846
50	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 02:57:11.331131	2026-05-19 02:57:11.369402
46	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 01:53:10.946158	2026-05-19 01:53:10.959595
48	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 02:46:57.649608	2026-05-19 02:46:57.67838
49	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	t	FAILED	2026-05-19 02:52:11.24635	2026-05-19 02:52:11.289791
51	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	f	FAILED	2026-05-19 13:35:00.198785	2026-05-19 13:35:01.168086
52	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	f	FAILED	2026-05-19 13:40:08.339148	2026-05-19 13:40:08.359913
57	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-19 14:37:50.336981	2026-05-19 14:39:08.6164
53	62000000-0000-0000-0000-000000000006	1	{"title": "주의 필요", "content": "지금 한번 Child Six에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000006", "childrenId": "61000000-0000-0000-0000-000000000006", "childrenName": "Child Six", "anomalyActionStatus": "NONE"}	f	FAILED	2026-05-19 13:45:08.628082	2026-05-19 13:45:08.653609
54	63000000-0000-0000-0000-000000000003	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "counselorName": "Counselor Three", "childrenReportId": "faf6e353-8ac1-4024-a165-d9213d67e2c6"}	t	SENT	2026-05-19 14:26:18.129512	2026-05-19 14:26:29.500817
64	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-19 15:28:14.486254	2026-05-19 15:28:15.257197
55	63000000-0000-0000-0000-000000000003	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "counselorName": "Counselor Three", "childrenReportId": "aa37a4c6-7e0f-46b9-9f21-3fcd6300b8c7"}	t	SENT	2026-05-19 14:26:52.854396	2026-05-19 15:04:07.103761
58	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-19 14:55:25.773789	2026-05-19 14:56:04.011424
60	62000000-0000-0000-0000-000000000003	6	{"title": "상담사 코멘트가 등록되었습니다", "content": "작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "childrenReportId": "aa37a4c6-7e0f-46b9-9f21-3fcd6300b8c7"}	t	SENT	2026-05-19 15:01:33.189897	2026-05-19 15:05:13.517548
62	62000000-0000-0000-0000-000000000003	6	{"title": "상담사 코멘트가 등록되었습니다", "content": "작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "childrenReportId": "52026450-b205-4777-bea3-4ac62c4cb23f"}	t	SENT	2026-05-19 15:08:45.226581	2026-05-19 15:16:22.258614
59	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-19 14:56:03.88665	2026-05-19 15:16:22.556975
56	62000000-0000-0000-0000-000000000003	6	{"title": "상담사 코멘트가 등록되었습니다", "content": "작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "childrenReportId": "faf6e353-8ac1-4024-a165-d9213d67e2c6"}	t	SENT	2026-05-19 14:27:16.970674	2026-05-19 15:41:41.719272
61	63000000-0000-0000-0000-000000000003	5	{"title": "새 부모 리포트가 등록되었습니다", "content": "상담 중인 자녀의 부모 리포트가 새로 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "counselorName": "Counselor Three", "childrenReportId": "52026450-b205-4777-bea3-4ac62c4cb23f"}	t	SENT	2026-05-19 15:08:17.066773	2026-05-19 15:38:32.114077
65	62000000-0000-0000-0000-000000000003	6	{"title": "상담사 코멘트가 등록되었습니다", "content": "작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "childrenReportId": "52026450-b205-4777-bea3-4ac62c4cb23f"}	t	SENT	2026-05-19 15:41:08.732087	2026-05-19 15:41:31.480383
63	62000000-0000-0000-0000-000000000003	6	{"title": "상담사 코멘트가 등록되었습니다", "content": "작성한 부모 리포트에 상담사 코멘트가 등록되었습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "counselorId": "63000000-0000-0000-0000-000000000003", "childrenReportId": "52026450-b205-4777-bea3-4ac62c4cb23f"}	t	SENT	2026-05-19 15:09:39.227372	2026-05-19 15:41:35.324719
66	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	SENT	2026-05-19 15:55:51.257665	2026-05-19 15:55:51.286136
67	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "NONE"}	t	SENT	2026-05-19 16:01:09.723872	2026-05-19 16:01:09.768547
72	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 15:27:03.415293	2026-05-20 15:27:05.242904
68	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 Child Three에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "Child Three", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-19 16:06:09.854002	2026-05-19 16:06:21.325573
76	62000000-0000-0000-0000-000000000003	1	{"title": "주의 필요", "content": "지금 한번 유주경에게 관심을 표현해볼까요?", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003", "childrenName": "유주경", "anomalyActionStatus": "REJECTED"}	t	SENT	2026-05-20 16:41:43.306836	2026-05-20 16:42:41.125307
77	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	t	SENT	2026-05-20 16:42:41.36801	2026-05-20 16:42:41.404094
83	61000000-0000-0000-0000-000000000003	7	{"title": "일기 작성 시간이에요", "content": "오늘의 마음을 기록해볼까요?", "childrenId": "61000000-0000-0000-0000-000000000003"}	f	FAILED	2026-05-20 20:30:00.147142	2026-05-20 20:30:02.512293
85	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	f	SENT	2026-05-20 23:52:15.081456	2026-05-20 23:52:15.552039
86	62000000-0000-0000-0000-000000000003	2	{"title": "대화를 시작했어요", "content": "자녀가 집에 있는 것으로 확인되어 AIoT 대화를 시작했습니다.", "parentId": "62000000-0000-0000-0000-000000000003", "childrenId": "61000000-0000-0000-0000-000000000003"}	f	SENT	2026-05-20 23:52:27.949142	2026-05-20 23:52:28.101242
\.


--
-- Data for Name: user_fcm_tokens; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.user_fcm_tokens (id, user_id, fcm_token, is_active, created_at, modified_at) FROM stdin;
48	61000000-0000-0000-0000-000000000001	fdV-8J3yRmClgJ7iQarpne:APA91bEZem9n6AnqI_T2iPjNCoOFxVizEJiMyjg_CELc6iYnYDg_ftsuq1vYWU172sKTsOO_NKmkRZWBZRRXZwbEQk4ZBd3SVKFLwWCdWl8Sn0e4C6zbATU	t	2026-05-18 23:31:48.795128	2026-05-18 23:33:07.072985
22	62000000-0000-0000-0000-000000000001	cgVlJanGS2SfqgulLmO7LF:APA91bGi6wmGGh3-KIA8RS4qUK9LlVMdgXi2MxUeGszJHHA9xcRTsRMVx90b91EUe7Pqb96roEh3wvFt2AzY1zFXFRvB4OmpvDD6yvArJoA42e4ovlKgSJY	t	2026-05-17 21:38:27.62271	2026-05-18 22:51:19.128175
30	61000000-0000-0000-0000-000000000003	cXfabIyfQoa9uFdrHrdmFR:APA91bHawLqhOWKY8V5y-UXCUTpBpbOML7VXNsmA6dwINTCls6Cqgr09FIdhqINHFY3lN6CKepGZ81vk4VjOKaQXyfpN61g5MhFhOc0FU9dNPfVYSUvGJeU	f	2026-05-18 21:46:30.507202	2026-05-20 20:30:02.512977
94	61000000-0000-0000-0000-000000000006	d23Qjo_QT7SEpo9cq5eC9P:APA91bF-dRokA0fH4ft4FgsNRib3JIEhOqrnAffdztmdd_lz8zx3p47zdhY9ztdbH5TV7S_qqyB8sWSBs-4HEghLuWk_t44SevLfoP7ktIapMom7SieVM1c	t	2026-05-19 09:55:29.72287	2026-05-19 10:40:23.924978
13	62000000-0000-0000-0000-000000000001	efNC9TVySVWmzo-C-AIsuW:APA91bHtoDTAcAVYn4A5lG8-mJfdEIcCwS9LXQs3tGGtyaNASP_Al6XA_f53rGXb1EQD9k6r8yjf-sKi1E7ooS725D6BrAt3927ViAIE38w1Grz0fs2IPeo	f	2026-05-16 21:04:46.340719	2026-05-18 20:09:57.268778
12	61000000-0000-0000-0000-000000000001	cpzmDxOkQQ29cL-zcJBsOP:APA91bGcW3_Xi5hViemQTXuThUsG-HeaT0WKLx1vAQJlJ8aQX9xtGg7KVEP9uxhY8-3MZrsVsfIjQCYGi_NbpWwIgL1WG6f2G-cRbPl3XLp3ZBNwpgJGajQ	f	2026-05-16 21:04:41.101164	2026-05-16 21:04:41.101164
28	61000000-0000-0000-0000-000000000006	fhwSOIcDToay9W2H_9F8cf:APA91bGy5l237SVdiMJnZCDHkRfVAI6WUbJ-VVbfkHNKyiY_ApEShoDLAXuRxai2p27DQg4Ylr4_O8IgMQe1dET66sEb1Qg8rCo8l8Hzs_mGiAk5fjhsTrc	t	2026-05-18 13:01:30.41138	2026-05-18 23:47:28.882685
15	bac71d57-f908-4d8a-9a7a-e1a0c71a55c9	ei78pDn0TxKRFea-W_psgW:APA91bEVYGj9HNuvz3fs7sCrT8x7l42iVWRVtma2Ewhtv2sWjmY5Rj3oNA-8E2ak0k6MqxkZJayxBltHKZS4yA75ffQB_t04S9_hwMCNyeb-irQGYqaW4eM	t	2026-05-17 14:57:27.516352	2026-05-17 14:57:27.516352
113	61000000-0000-0000-0000-000000000006	dBjSxWuVRO2WU5urc6A4Ur:APA91bGw-Z50U9wkYPxC0FjmxbXAyo1tANSuCVFGVswzZvkMwMG1uSYuZ6M0wejnNtrVSJkcNKNC-KMfVBpSw4J0Etm0Sz_ZI19rAgCC6fX7bwVTygPOsd4	t	2026-05-19 11:13:23.691424	2026-05-19 13:13:24.053539
65	61000000-0000-0000-0000-000000000006	fOk2cm3vR4CDfGZzQL25kM:APA91bFOfp1kLp3grJguPNaQLyjBjcqnLK9FlyoFS9_-gcq9u6_kKrm4NY6YE8hIrOGx8Uqy5lNBb_xUovCp73pquQmamL5EHp6QjQIrGb0fi8Wfw1byv40	t	2026-05-19 00:42:47.313887	2026-05-19 03:18:34.557299
89	61000000-0000-0000-0000-000000000006	coSXr2oKSUKnA5vi_dT68b:APA91bGFLPo4sPauwk6_vCCZcAh2Fg05aQ0PxXAfVnJf4vOCfrilvbjT1UIvB0vZLctM1rIvk2_zKjxoXhn6zffErx1foc_kIOFc8JiGcLyzz3R5d28HmKE	t	2026-05-19 04:38:17.871567	2026-05-19 04:38:17.894294
19	61000000-0000-0000-0000-000000000004	dbMxUjyvTEugRJINiPlTII:APA91bH7vhIIHb1dntKFjc8Ru6YjyyJVURTqtPVzpgmuAvF7i6KtwESefZn84_L_P4ru4PZsTs2_k7GMurZfeMmFtfFuhpfLq1_hJEgQlPqteTu1nQEZDcA	t	2026-05-17 19:38:18.909669	2026-05-17 21:36:30.008319
24	61000000-0000-0000-0000-000000000001	ferj8BKlSlyorljOjFlXR1:APA91bEXzFtXPYjlhFJn5BZhU3sSkS1WuHesbdwkUWvWKGqISR126AT0PbpKYAvBqSSplrkCMwRuJTQv1h8CitJqh3XKmrMK6Ky6rEsHnVy_qs7A5rk3vJQ	t	2026-05-17 21:39:41.197521	2026-05-17 21:39:41.197521
63	61000000-0000-0000-0000-000000000001	dEbLAq8hSUGb5lMa4KBkQn:APA91bG7C_WOHpQRkK09BNyaFZnZAeiWl9zKzHHPzXOL3goL3qz7yIC-XNPOKwy0OhAHTz6CKLv3p1I4QlGv9R9Po0jwQjeYpDL2jzgwPZ-_4CLzom8nNgA	t	2026-05-19 00:34:03.500372	2026-05-19 11:05:40.056382
21	62000000-0000-0000-0000-000000000001	fLuXGBRiQBCofyarswdyNw:APA91bH3vkgBDG6Zhfn-qPSVmssBZ-3sKyipdtRaE4jfTXcvL1OiYNCDW2DOwGGbE6_8A2Gu_JTcLkySM9G1YMkC2J5XEl_65HE1DULOMUIgtBi5JDSZHuw	f	2026-05-17 20:21:07.485855	2026-05-18 20:09:57.268922
121	62000000-0000-0000-0000-000000000003	eysCp-xHS-GiapqbCjxfFd:APA91bF1s-J3IJGj7nTXsvF9Gg8BWsblEUVJmRLsMmkKJ1H8PzlX96bIIqJjGL48rr9Ev4zWCJy3o5csM6RAEmVGd3lUvfbjXkTm-oADdnRvoK89zAhfCXE	t	2026-05-19 14:23:27.89857	2026-05-19 16:03:21.602339
20	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	cvzemwHeSlKraypD-u1JrV:APA91bGMJjnZJ-NZhwqgvHNMDkNWZCsZxSCK7aFdQklvLawjBvHOrhx6aAmo4jjJNHAHnKdVQhY83wqOXMEtX6MaqvRqzRiQ70O4OCLxBwTxPGDZp6tH100	t	2026-05-17 20:20:07.375662	2026-05-18 17:17:13.955787
10	61000000-0000-0000-0000-000000000001	c5u7sQ3DTy-hblkTgOEd1C:APA91bFcXIKeyIC-8kGG_AOmlTwE7NFxcL9J26FA3KZ-UJqsGnrh0mv6uuWLqT9pnW09GJGuBsVgx_u2_zwlME4FXSzwZXUJHtTikXOQufiTzPTPlPotc5M	f	2026-05-16 21:03:59.714924	2026-05-18 20:30:01.353563
17	61000000-0000-0000-0000-000000000001	d11UK8ukQlmQ8dJAgBYouL:APA91bEID_p0CPqvvBhKLL942o_dOUvC3aqWJIjbCtScmphMbfnRg1VRgsS368pQvcf9xOlQ30ODuWxssMcSJvSsee4MEISUpD370bLPsIin1gjG13IRYBE	f	2026-05-17 19:35:26.742103	2026-05-18 20:30:01.353637
18	61000000-0000-0000-0000-000000000001	dCac6RncTiyVO9SQLCJJCi:APA91bFItduP_ZeIxaSYmEpByKVmQLhwv6HNQkCI6wu7Y5gCz4Uz-o-rg09UiSXc1zsU29JdyK7zpM9gSZkcO894IgsMBU29ioq_dCnZ6-CgeYFiiV4YDvY	f	2026-05-17 19:36:08.236015	2026-05-18 20:30:01.353704
26	61000000-0000-0000-0000-000000000001	ciljP4-zSNqooFjkN-BMKY:APA91bEoCTtLLSwWzpvpwSLoHbSf6tt1XYkTc1X4TT6UziMGBIK0-S4baY-F5UfkNZwJgA9MMumgOXFEFWPUMavIhcbMhjC2D8KejofAZevVB6m9n30cwKE	f	2026-05-17 21:41:27.69357	2026-05-18 20:30:01.353788
119	61000000-0000-0000-0000-000000000006	dYmvCDabTb-rKoGFnOmjmH:APA91bF7qk8uzIg_siAWfW3H1AVcmEAZTvzfKmoYbACfJaMAJT6QaIgm3vHK20GEAqW1VqRESHepZ1ogLXX_RvGMujy1oqsIWv-hZBMQr8ugExTprMPWx08	t	2026-05-19 14:23:16.356134	2026-05-19 23:26:41.63483
36	62000000-0000-0000-0000-000000000003	epdtuNDKRoqrmW7jXWOK3n:APA91bH46FJcN04zsjBhNEL318augxeDhEbNuqWYEbCKwUC6AQ2Zqo5Jbd--nX3U_5S3eOOxGvI6GmgGxnA98a_Q0LhCdIrv29DOoxKoRqxMyn3PI1HikoQ	f	2026-05-18 22:42:22.141309	2026-05-20 15:27:05.243079
\.


--
-- Name: notification_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.notification_schedules_id_seq', 8, true);


--
-- Name: notification_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.notification_settings_id_seq', 9, true);


--
-- Name: notification_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.notification_types_id_seq', 28, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.notifications_id_seq', 86, true);


--
-- Name: user_fcm_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.user_fcm_tokens_id_seq', 144, true);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: notification_schedules notification_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_schedules
    ADD CONSTRAINT notification_schedules_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_key UNIQUE (user_id);


--
-- Name: notification_types notification_types_name_key; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_types
    ADD CONSTRAINT notification_types_name_key UNIQUE (name);


--
-- Name: notification_types notification_types_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_types
    ADD CONSTRAINT notification_types_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: user_fcm_tokens user_fcm_tokens_fcm_token_key; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.user_fcm_tokens
    ADD CONSTRAINT user_fcm_tokens_fcm_token_key UNIQUE (fcm_token);


--
-- Name: user_fcm_tokens user_fcm_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.user_fcm_tokens
    ADD CONSTRAINT user_fcm_tokens_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_notification_schedules_day_time; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_notification_schedules_day_time ON public.notification_schedules USING btree (day, "time");


--
-- Name: idx_notification_schedules_user_type; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_notification_schedules_user_type ON public.notification_schedules USING btree (user_id, notification_type_id);


--
-- Name: idx_notifications_receiver_created; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_notifications_receiver_created ON public.notifications USING btree (receiver_id, created_at DESC);


--
-- Name: idx_notifications_receiver_read_created; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_notifications_receiver_read_created ON public.notifications USING btree (receiver_id, is_read, created_at DESC);


--
-- Name: idx_user_fcm_tokens_user_active; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX idx_user_fcm_tokens_user_active ON public.user_fcm_tokens USING btree (user_id, is_active);


--
-- Name: notifications fk_notifications_type; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_type FOREIGN KEY (notification_type_id) REFERENCES public.notification_types(id);


--
-- Name: notification_schedules fk_schedules_notification_type; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.notification_schedules
    ADD CONSTRAINT fk_schedules_notification_type FOREIGN KEY (notification_type_id) REFERENCES public.notification_types(id);


--
-- PostgreSQL database dump complete
--

\unrestrict tBEQ51FFsbwpl9b90Aoah5qjAPcA1fCgSLxpIEQng2hKxrtstgFviSsXa4pYb7N

--
-- Database "rebloom_report" dump
--

--
-- PostgreSQL database dump
--

\restrict zAXaiOfQLr2tpHJB0QXi0ZiRcWlzBGKw7nMzE4fKKzOMC4hFDiewAgDt0XcwUIm

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: rebloom_report; Type: DATABASE; Schema: -; Owner: rebloom
--

CREATE DATABASE rebloom_report WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE rebloom_report OWNER TO rebloom;

\unrestrict zAXaiOfQLr2tpHJB0QXi0ZiRcWlzBGKw7nMzE4fKKzOMC4hFDiewAgDt0XcwUIm
\connect rebloom_report
\restrict zAXaiOfQLr2tpHJB0QXi0ZiRcWlzBGKw7nMzE4fKKzOMC4hFDiewAgDt0XcwUIm

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analysis_keywords; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.analysis_keywords (
    keyword_id integer NOT NULL,
    keyword character varying NOT NULL
);


ALTER TABLE public.analysis_keywords OWNER TO rebloom;

--
-- Name: analysis_keywords_keyword_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.analysis_keywords ALTER COLUMN keyword_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.analysis_keywords_keyword_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: children_reports; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.children_reports (
    id uuid NOT NULL,
    children_id uuid NOT NULL,
    parent_id uuid NOT NULL,
    emotion_tag character varying NOT NULL,
    context character varying NOT NULL,
    report_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    has_counselor_comment boolean DEFAULT false NOT NULL
);


ALTER TABLE public.children_reports OWNER TO rebloom;

--
-- Name: conversation_analysis; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.conversation_analysis (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone NOT NULL,
    embedding_text character varying NOT NULL,
    prediction double precision NOT NULL,
    is_ai_initiated boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversation_analysis OWNER TO rebloom;

--
-- Name: conversation_keywords; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.conversation_keywords (
    keyword_id integer NOT NULL,
    analysis_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.conversation_keywords OWNER TO rebloom;

--
-- Name: counselor_comments; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.counselor_comments (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    context text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    parent_report_id uuid NOT NULL
);


ALTER TABLE public.counselor_comments OWNER TO rebloom;

--
-- Name: diaries; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.diaries (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    diary_date date NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    emotion_icon_id integer NOT NULL
);


ALTER TABLE public.diaries OWNER TO rebloom;

--
-- Name: diary_analysis; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.diary_analysis (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    target_date timestamp without time zone NOT NULL,
    emotion_icon character varying NOT NULL,
    embedding_text character varying NOT NULL,
    prediction double precision NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.diary_analysis OWNER TO rebloom;

--
-- Name: diary_emotions; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.diary_emotions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    diary_date date NOT NULL,
    created_at timestamp without time zone NOT NULL,
    modified_at timestamp without time zone NOT NULL,
    emotion_icon_id integer NOT NULL
);


ALTER TABLE public.diary_emotions OWNER TO rebloom;

--
-- Name: diary_keywords; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.diary_keywords (
    keyword_id integer NOT NULL,
    analysis_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.diary_keywords OWNER TO rebloom;

--
-- Name: emotion_icon; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.emotion_icon (
    id integer NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.emotion_icon OWNER TO rebloom;

--
-- Name: emotion_icon_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.emotion_icon ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.emotion_icon_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


ALTER TABLE public.flyway_schema_history OWNER TO rebloom;

--
-- Name: recent_trend; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.recent_trend (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    report_date date NOT NULL,
    summary character varying NOT NULL
);


ALTER TABLE public.recent_trend OWNER TO rebloom;

--
-- Name: shedlock; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.shedlock (
    name character varying(64) NOT NULL,
    lock_until timestamp(3) without time zone NOT NULL,
    locked_at timestamp(3) without time zone NOT NULL,
    locked_by character varying(255) NOT NULL
);


ALTER TABLE public.shedlock OWNER TO rebloom;

--
-- Name: status_cards; Type: TABLE; Schema: public; Owner: rebloom
--

CREATE TABLE public.status_cards (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    title character varying NOT NULL,
    description character varying NOT NULL,
    sub_title character varying NOT NULL,
    suggestion character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.status_cards OWNER TO rebloom;

--
-- Name: status_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: rebloom
--

ALTER TABLE public.status_cards ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.status_cards_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: analysis_keywords; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.analysis_keywords (keyword_id, keyword) FROM stdin;
9	학업
10	지침
11	긍정
1	friend
2	school
3	family
4	sleep
5	anxiety
6	activity
7	stress
8	praise
12	중립
13	분노
14	슬픔
15	친구
16	금전
17	폭력
18	가족
19	피곤
20	집중력 저하
21	부정
22	수면
\.


--
-- Data for Name: children_reports; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.children_reports (id, children_id, parent_id, emotion_tag, context, report_date, created_at, modified_at, has_counselor_comment) FROM stdin;
a7a0660d-b889-47b9-b815-9dad7514fa0d	b06723a2-7396-4805-b311-189dba52396a	7c10d614-23c5-423f-8c8d-944c64158a89	침묵	작성	2026-05-15 15:06:00	2026-05-15 15:06:17.934741	2026-05-15 15:06:17.934741	f
efe4b09e-6f0a-41dc-897b-d9c048fecf2c	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	예민	기록해보기!!	2026-05-16 14:49:00	2026-05-16 14:49:43.359977	2026-05-16 14:49:43.359977	f
8d8d12be-635f-4de3-a9e4-90d37cfe73b8	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	피곤	ㅇㄴㄹㄴㅇㅁㄹㅇㄴㄹㄴㅇㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㅇㄴㄹㄴㅇㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹㄹ	2026-05-16 15:35:00	2026-05-16 15:35:32.240921	2026-05-16 15:35:32.240921	f
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	calm	Child started homework independently and talked calmly about the day.	2026-05-07 20:10:00	2026-05-07 20:10:00	2026-05-07 20:10:00	t
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2	61000000-0000-0000-0000-000000000002	62000000-0000-0000-0000-000000000002	anxiety	Child showed tension about school adjustment and peer relationships.	2026-05-07 20:20:00	2026-05-07 20:20:00	2026-05-07 20:20:00	t
aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003	happy	Child recorded a fun afternoon playing soccer with friends.	2026-05-07 20:30:00	2026-05-07 20:30:00	2026-05-07 20:30:00	t
29a4eaed-3d69-4313-9179-5b937ecefcfe	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	불안	오늘 승형이가 화를 내고 물건을 집어 던졌다. 불만이 생겼을 때 물건을 던지는 버릇이 생겼다	2026-05-16 15:35:00	2026-05-16 15:35:18.519856	2026-05-16 15:35:18.519856	t
7cf1277c-4ae9-446f-8cdd-8651f485588b	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	불안	2차 기록	2026-05-16 14:50:00	2026-05-16 14:50:28.543502	2026-05-16 14:50:28.543502	t
fb229f41-b699-4691-8d67-9e1c8ca19afa	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	활발	1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12	2026-05-16 15:36:00	2026-05-16 15:36:00.494836	2026-05-16 15:36:00.494836	f
e16d28a4-08ef-46f4-a60c-410de5d107c4	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	피곤	6ㅌ1111116666666666666666666666666666666666666666666666666666666666666666666666666692336991111111111111112555555555555588558885885885885858558888855888237357357567327273576572373272373276275673276576576576275676276576276575676576576575672372372373275676579576579572676573277327327237657657567657959756795765732762723756765798756765765723723723732756756756765756756732732765765756765765765765765765756723723732732732732723732735765765765762765765765ㄴㄷㅂㄴㄷㅂㄷㄴㅂㄷㄴㅂㄴㄷㅂㄷㄴㅂㄷㄴㅂㄷㄴㅂㄷㄴㅂㄷㄴhfzrhzhfzhfzruzurzruzhfzhfxjfxfjxjgxkgckgckgckgzjfsjgxkg kyckgckg jgdmyciyciycykdkhditditdjtdiydiydiydu0fupfoyfoydoyfoydoyfoyfoyfoydoyxkydoyfxkckyocoystditdkyykxxykyxxkhxkgchkchkchkxhkxkgxykxkyxykdkydydoidydyodhkxhkxkhxhmxkgxkhxykdyodoyfckhckhcoyxyidyodykdoydoyfoydyodlydyockyckhckhckyfkychkxkyckyxkyckyckycgkcykckyckhckychmdhfoyckydkydkgxkyxykxgkxgxgmckckhciyfkhckuvohvkhviuyidiy	2026-05-17 15:35:00	2026-05-17 15:35:20.250456	2026-05-17 15:35:20.250456	f
1e5db996-235d-4eb1-af1b-1dee336d6f0d	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	피곤	rsdzcfsdfdsf	2026-05-17 20:25:00	2026-05-17 20:25:27.534893	2026-05-17 20:25:27.534893	f
7d981272-13a3-4eb2-b055-352029e68235	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	불안	sdaasdfasdfdsfasdaf	2026-05-17 20:56:00	2026-05-17 20:56:49.48237	2026-05-17 20:56:49.48237	f
bbebd5f6-699f-4cf2-9e6c-0acd5b51bdba	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	불안	dsfds	2026-05-17 22:00:00	2026-05-17 22:00:31.070861	2026-05-17 22:00:31.070861	f
aeb9793b-f03e-4b9f-ad42-4d6fbc36bd0a	61000000-0000-0000-0000-000000000001	62000000-0000-0000-0000-000000000001	불안	dddddd	2026-05-17 22:01:00	2026-05-17 22:01:00.173796	2026-05-17 22:01:00.173796	f
faf6e353-8ac1-4024-a165-d9213d67e2c6	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003	예민	잠을 못잤는지 예민하고 피곤해보인다	2026-05-19 14:26:00	2026-05-19 14:26:17.118703	2026-05-19 14:27:16.759129	t
aa37a4c6-7e0f-46b9-9f21-3fcd6300b8c7	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003	피곤	피곤해서 짜증이 많아짐	2026-05-19 14:26:00	2026-05-19 14:26:52.818718	2026-05-19 15:01:33.161888	t
52026450-b205-4777-bea3-4ac62c4cb23f	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003	불안	아이가 친구와 다툼이 있어 많이 서운해 하는 것 같다	2026-05-19 15:08:00	2026-05-19 15:08:16.732276	2026-05-19 15:41:08.706697	t
afc80d6e-e551-4084-80a5-e22e13d5a5c9	61000000-0000-0000-0000-000000000003	62000000-0000-0000-0000-000000000003	피곤	아이가 오늘은 유독 피곤해 보인다	2026-05-20 14:13:00	2026-05-20 14:13:31.394003	2026-05-20 14:13:31.394003	f
\.


--
-- Data for Name: conversation_analysis; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.conversation_analysis (id, user_id, started_at, ended_at, embedding_text, prediction, is_ai_initiated, created_at, modified_at) FROM stdin;
cebd430c-3a3f-48c0-aa76-ded715bbd954	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-18 14:34:03	2026-05-18 14:34:48	사용자가 인사하자 봇이 친근하게 안부를 묻고 흥미로운 일이나 대화를 해보자고 제안했다.	3.5	f	2026-05-18 14:35:03.085765	2026-05-18 14:35:03.085765
f6f92747-f00b-4369-809a-d473fa368249	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-18 14:34:52	2026-05-18 14:35:06	사용자가 인사하자 봇이 같은 인사로 응답하며 좋은 일이 있었는지 아니면 힘든 일이 있었는지 물어보고 이야기를 나누자고 제안함.	3.5	f	2026-05-18 14:35:38.728387	2026-05-18 14:35:38.728387
4eb33cd5-8f46-427a-99c2-bf799213f5b8	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-18 14:44:26	2026-05-18 14:44:46	사용자가 봇에게 안부를 묻자 봇은 자신의 하루가 평범했다고 답하고 사용자의 하루에 재미있거나 힘든 일이 있었는지 얘기해 달라고 묻는다.	10.5	f	2026-05-18 14:45:01.023863	2026-05-18 14:45:01.023863
94e319b4-e796-48b0-bcaa-6c2d74bcc3de	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-18 14:38:25	2026-05-18 14:39:57	취업이 잘 안돼서 특히 서류전형에 계속 떨어져 답답하고 불안하며 자신감이 떨어진다고 호소하자, 상대방이 공감하며 구체적으로 어디가 막히는지(자기소개서나 자격증 등)를 물으며 위로하고 있다.	3.5	f	2026-05-18 14:40:25.598242	2026-05-18 14:40:25.598242
3f37067c-5dbb-4680-82d9-7927a99ce225	61000000-0000-0000-0000-000000000003	2026-05-19 13:52:53	2026-05-19 13:53:24	사용자가 인사하자 봇이 친근하게 맞아주며 궁금하거나 힘든 일이 있으면 편하게 말하라며 오늘 하루와 특별히 신경 쓰이는 일이 있는지 물었다.	17.5	f	2026-05-19 13:53:42.40969	2026-05-19 13:53:42.40969
a27248d4-b0ec-4413-9eb7-8873c206effe	61000000-0000-0000-0000-000000000003	2026-05-19 13:58:16	2026-05-19 13:58:46	사용자는 '응, 그런지'라고 답했고, 봇은 이유를 더 자세히 알려달라며 상황을 묻고 '무슨 이유인지 알면 도움이 될 것 같다'며 공감하고 안심시키는 반응을 보였다.	17.5	f	2026-05-19 13:59:07.984706	2026-05-19 13:59:07.984706
1c002033-ef54-4494-acff-23aa11815f49	61000000-0000-0000-0000-000000000003	2026-05-19 14:27:50	2026-05-19 14:28:09	사용자가 인사하자 챗봇이 자신을 소개하며 오늘 하루가 어땠는지 물어보고 편하게 이야기하라고 친절히 권유함.	17.5	f	2026-05-19 14:28:26.838371	2026-05-19 14:28:26.838371
2e437688-e468-4120-be5f-c0c69e89b323	61000000-0000-0000-0000-000000000003	2026-05-19 16:49:49	2026-05-19 16:50:30	사용자가 힘들다고 표현했고, 대화 상대는 공감하며 어떤 부분이 특히 어려운지 물어보고 경청하겠다고 답함.	17.5	f	2026-05-19 16:50:53.941959	2026-05-19 16:50:53.941959
9c549da2-a867-4648-8689-ddc68213a559	61000000-0000-0000-0000-000000000003	2026-05-19 19:42:34	2026-05-19 19:44:23	친구들에게 괴롭힘을 당해 불안하고 당황스러우며, 어떻게 해결해야 할지 몰라 구체적인 도움과 해결책을 원함.	10.5	f	2026-05-19 19:44:41.352933	2026-05-19 19:44:41.352933
36f1fc44-bce1-4516-b20d-fe43bbc87847	61000000-0000-0000-0000-000000000003	2026-05-20 12:05:00	2026-05-20 12:10:00	기운이 없고 학교 가는 것이 부담스럽고, 밤에 잠을 잘 못 자며 걱정이 많아짐.	10.5	f	2026-05-20 12:01:51.137332	2026-05-20 12:01:51.137332
a59c9331-f93c-4981-a51e-7317594dbe93	61000000-0000-0000-0000-000000000003	2026-05-20 12:25:00	2026-05-20 12:30:00	최근에 즐거움이 없고 피곤함을 느끼며 친구들과의 외출도 싫어하는 상태.	10.5	f	2026-05-20 12:09:30.742585	2026-05-20 12:09:30.742585
3564fdd6-c70a-4beb-83d7-b1713c159182	61000000-0000-0000-0000-000000000003	2026-05-20 12:31:00	2026-05-20 12:36:00	밤에 걱정으로 잠이 안 오고, 아침에 머리가 무겁고 학교에서 집중이 잘 안 된다.	10.5	f	2026-05-20 12:09:38.15639	2026-05-20 12:09:38.15639
19433bae-2e74-4041-b048-a2161c4c6b8a	61000000-0000-0000-0000-000000000003	2026-05-20 12:23:30	2026-05-20 12:24:27	인사 요청, 대화 시작, 고민 나누기, 추가 설명 요청.	17.5	f	2026-05-20 12:24:32.832258	2026-05-20 12:24:32.832258
d99338fb-47f5-4645-9a9c-be2c305d6982	61000000-0000-0000-0000-000000000003	2026-05-20 12:29:05	2026-05-20 12:29:19	안녕, 어떻게 지내고 있어? 오늘 하루 어떤 일이 있었는지 이야기해줄래?	10.5	f	2026-05-20 12:29:31.90865	2026-05-20 12:29:31.90865
db6726a7-ded6-4d85-8c46-f56969547204	61000000-0000-0000-0000-000000000003	2026-05-20 12:32:21	2026-05-20 12:32:45	안녕, 하루에 대한 이야기와 특별한 일에 대해 나누자는 대화.	17.5	f	2026-05-20 12:32:52.740992	2026-05-20 12:32:52.740992
eaf32de8-0ebb-4802-b0e3-281b556a4940	61000000-0000-0000-0000-000000000003	2026-05-20 12:32:57	2026-05-20 12:33:28	영상 편집이 복잡하고 힘들게 느껴져 스트레스를 받고 있다. 어떤 부분이 특히 어렵게 느껴지는지 질문.	10.5	f	2026-05-20 12:33:36.571651	2026-05-20 12:33:36.571651
ade14f0d-db49-4d07-8363-a1cd979cf4bf	61000000-0000-0000-0000-000000000003	2026-05-20 12:34:31	2026-05-20 12:34:46	테스트 요청, 감정 이해 표현.	14	f	2026-05-20 12:34:51.587137	2026-05-20 12:34:51.587137
62c7e263-5f68-43ae-93c4-ab371276a2c3	61000000-0000-0000-0000-000000000003	2026-05-20 12:25:00	2026-05-20 12:30:00	최근에 즐거움이 없고 피곤함을 느끼며 친구들과의 외출도 싫어하는 상태.	10.5	f	2026-05-20 12:49:27.064349	2026-05-20 12:49:27.064349
fd58af14-44df-466b-a457-4a43172ef399	61000000-0000-0000-0000-000000000003	2026-05-20 13:07:00	2026-05-20 13:13:00	시험 불안, 집중 어려움, 부모님 기대 부담, 과목 선택, 부담 줄이기	10.5	f	2026-05-20 12:50:15.174658	2026-05-20 12:50:15.174658
5b1d3546-8284-4da4-a235-30737dba54c7	61000000-0000-0000-0000-000000000003	2026-05-20 13:00:00	2026-05-20 13:06:00	친구와 싸운 후 마음이 불편하고 먼저 말을 걸고 싶지만 용기가 나지 않음. 사과하면 친구가 차갑게 대답할까 두려움. 그래도 내일 짧게라도 미안하다고 말해보고 싶음.	10.5	f	2026-05-20 12:50:19.712304	2026-05-20 12:50:19.712304
5a6cc094-7482-41cf-ba5e-8d3b7fb00f4a	61000000-0000-0000-0000-000000000003	2026-05-20 13:14:00	2026-05-20 13:20:00	저녁에 외로움을 느끼고 친구에게 연락하고 싶지만 방해할까 봐 망설이고 있다. 짧게 안부를 보내는 것을 고려 중이다.	10.5	f	2026-05-20 12:50:19.83807	2026-05-20 12:50:19.83807
07c7f526-f0e3-4d4a-a71b-e2fcc5137706	61000000-0000-0000-0000-000000000003	2026-05-20 14:00:00	2026-05-20 14:14:00	친구가 오해한 것에 대해 하루 종일 신경 쓰였고, 설명하려 했지만 친구가 바빠서 말을 못 걸었다. 내일 짧게라도 오해를 풀고 싶다.	10.5	f	2026-05-20 12:52:59.570204	2026-05-20 12:52:59.570204
25f5e30e-2cd3-4974-9b77-3471bd0face1	61000000-0000-0000-0000-000000000003	2026-05-20 14:32:00	2026-05-20 14:47:00	부모님과 성적에 대한 대화로 마음이 무거워졌고, 기대에 미치지 못하는 것 같아 속상함을 느꼈다. 열심히 하고 있지만 결과가 늦어 답답함을 느끼고 있다. 오늘은 공부 계획을 작게 나눠서 해보려 한다.	10.5	f	2026-05-20 12:52:59.696602	2026-05-20 12:52:59.696602
d38545fe-ef36-4251-b435-15512aafbd00	61000000-0000-0000-0000-000000000003	2026-05-20 14:15:00	2026-05-20 14:31:00	학교생활이 바쁘고 과제가 많아 스트레스를 느끼고 있으며, 잠을 잘 이루지 못하고 있다. 급한 과제를 우선적으로 끝내려는 계획이 있다.	10.5	f	2026-05-20 12:52:59.74835	2026-05-20 12:52:59.74835
dccba1b8-b9ed-4ee6-a963-2f440213552c	61000000-0000-0000-0000-000000000003	2026-05-20 14:48:00	2026-05-20 15:05:00	외로움을 느끼고 친구들과의 대화에 끼어들기 어려워하는 감정에 대해 이야기함. 내일 웃긴 이모티콘을 보내는 것을 고려 중.	10.5	f	2026-05-20 12:53:02.099307	2026-05-20 12:53:02.099307
c21a8d8c-0e32-494e-b0b7-e056621bc5fc	61000000-0000-0000-0000-000000000003	2026-05-20 15:06:00	2026-05-20 15:25:00	사용자가 아침부터 피곤함을 느끼고 수업 중 집중하지 못했다고 언급함. 친구와의 대화에서 짧게 대답해 미안함을 느낌. 집에 오니 아무것도 하기 싫고 누워 있고 싶다고 표현함. 숙제를 20분만 하기로 결정함.	10.5	f	2026-05-20 12:53:04.874696	2026-05-20 12:53:04.874696
af58df21-84d2-4f06-b728-832126be1e11	61000000-0000-0000-0000-000000000003	2026-05-20 13:41:01	2026-05-20 13:42:26	친구들이 나와 밥을 안 먹어줘서 고민하고 있으며, 내가 뭘 잘못했는지 모르겠다고 느끼고 있다. 친구에게 먼저 다가가는 것이 무섭다고 이야기하고 있다.	10.5	f	2026-05-20 13:42:34.390032	2026-05-20 13:42:34.390032
49bb11c2-d481-48d4-8ba9-4d13517ff5c4	61000000-0000-0000-0000-000000000003	2026-05-20 14:43:54	2026-05-20 14:44:31	안녕! 친구와 같은 존재로 학교 생활이나 일상 이야기, 고민을 나눌 수 있다. 이야기에 귀 기울이고 진심으로 공감할 것.	11	f	2026-05-20 14:44:39.416086	2026-05-20 14:44:39.416086
be87c69b-fed0-462b-865a-fffa2e3464bc	61000000-0000-0000-0000-000000000003	2026-05-20 15:21:20	2026-05-20 15:21:58	친구처럼 감정을 이해하고 공감해주며 힘든 일이나 기쁜 일, 일상 이야기를 나누고 싶다는 내용.	11	f	2026-05-20 15:22:07.169935	2026-05-20 15:22:07.169935
996792f2-bd94-4612-adb2-50aed4aea57e	61000000-0000-0000-0000-000000000003	2026-05-20 15:22:33	2026-05-20 15:24:14	사용자가 친구와의 관계에서 소외감을 느끼고 있으며, 이를 털어놓고 도움을 요청함. 봇은 사용자의 감정을 이해하고 지원을 제공하겠다고 응답함.	11	f	2026-05-20 15:24:31.370829	2026-05-20 15:24:31.370829
cedb3601-228d-4c37-9139-84cdb91c1679	61000000-0000-0000-0000-000000000003	2026-05-20 15:27:05	2026-05-20 15:27:38	사용자가 친구들과의 관계에 대해 이야기하고 싶어함.	18	f	2026-05-20 15:27:44.122782	2026-05-20 15:27:44.122782
8b5f67c5-0ae3-468c-a737-10bb61e16c24	61000000-0000-0000-0000-000000000003	2026-05-20 15:27:42	2026-05-20 15:28:18	대화 시작, 사용자에게 이야기 요청, 편안한 분위기 조성.	18	f	2026-05-20 15:28:25.833459	2026-05-20 15:28:25.833459
ce2e082f-f79e-4fd4-aa7a-cc74caef3e1c	61000000-0000-0000-0000-000000000003	2026-05-20 15:28:31	2026-05-20 15:29:33	다툼으로 인해 마음이 복잡하고 잠을 잘 못 자는 상황에 대해 고민하고 있다.	11	f	2026-05-20 15:29:39.154791	2026-05-20 15:29:39.154791
b4bf5363-4a29-48d6-a526-49fc193d7a8e	61000000-0000-0000-0000-000000000003	2026-05-20 15:38:11	2026-05-20 15:38:47	사용자가 고민을 이야기하고 싶어하며, 봇이 사용자의 이야기를 듣고 싶어함.	18	f	2026-05-20 15:38:53.304169	2026-05-20 15:38:53.304169
54a699b4-7195-40e5-b7a4-d34606afa773	61000000-0000-0000-0000-000000000003	2026-05-20 15:39:44	2026-05-20 15:40:19	친구에 대한 이야기와 감정, 경험을 나누고 싶다는 요청.	0.5	f	2026-05-20 15:40:24.880482	2026-05-20 15:40:24.880482
d6bdd023-ecd8-4aac-886d-8645a9ab9d7b	61000000-0000-0000-0000-000000000003	2026-05-17 20:05:01	2026-05-17 20:08:11	주말에 가족들과 놀러가서 재미있었던일을 이야기 함	3.7	f	2026-05-17 20:05:01.880482	2026-05-17 20:05:01.880482
792abe9f-b2b0-41a9-bde0-d940288528b6	61000000-0000-0000-0000-000000000003	2026-05-18 20:03:11	2026-05-18 20:13:00	잘 안풀린 문제에 대해서 설명함	7.8	f	2026-05-18 20:03:11.880482	2026-05-18 20:03:11.880482
d75b7f97-d8eb-46cb-9f3d-b09f7b9a5e4c	61000000-0000-0000-0000-000000000003	2026-05-20 16:51:04	2026-05-20 16:51:39	친구와 학교 생활, 친구 관계, 공부 스트레스에 대해 이야기 나눌 수 있는 존재.	11	f	2026-05-20 16:51:46.69427	2026-05-20 16:51:46.69427
b6ef7a81-ba93-49db-8fd0-8a8931dc7164	61000000-0000-0000-0000-000000000003	2026-05-16 21:05:34	2026-05-16 21:10:00	시험 점수가 나왔는데 너무 안좋아서 죽고싶다.	18.5	f	2026-05-16 21:10:00.880482	2026-05-16 21:10:00.880482
9762562b-a170-49ea-b44a-9b85e3b80d0c	61000000-0000-0000-0000-000000000003	2026-05-20 16:51:58	2026-05-20 16:52:50	사용자가 친구에게 소개를 요청하고, 친구는 공감과 지지를 제공하고 싶다고 말함. 사용자가 외로움과 슬픔을 느끼고 있다고 표현함.	11	f	2026-05-20 16:53:54.616474	2026-05-20 16:53:54.616474
31e11675-9e7e-4594-a8e8-3f91a28fc9b6	61000000-0000-0000-0000-000000000003	2026-05-15 22:35:21	2026-05-15 22:40:21	친구들이랑 재미있게 놀았다.	6.7	f	2026-05-15 22:40:21.880482	2026-05-15 22:40:21.880482
d3b9fe24-ff9b-44b1-b02d-946102e65404	61000000-0000-0000-0000-000000000003	2026-05-14 22:11:21	2026-05-14 22:15:21	오늘 하루도 즐거웠다.	4.2	f	2026-05-14 22:15:21.880482	2026-05-14 22:15:21.880482
7ebfc0ec-2544-47f4-97da-28f91591675d	61000000-0000-0000-0000-000000000003	2026-05-13 20:04:23	2026-05-13 20:10:23	오늘은 뿌듯한 하루였다.	2.3	f	2026-05-13 20:10:23.880482	2026-05-13 20:10:23.880482
50ba8bc5-2c28-4a06-8c07-051cff6b433c	61000000-0000-0000-0000-000000000003	2026-05-12 20:04:23	2026-05-12 20:14:23	왠지 모르게 우울한 하루	15	f	2026-05-12 20:14:23.880482	2026-05-12 20:14:23.880482
31adf4f0-0a31-4476-a50c-5666144b0380	61000000-0000-0000-0000-000000000003	2026-05-11 21:04:23	2026-05-11 21:14:23	월요일이라서 학교를 갔고, 주말이 그립다.	12	f	2026-05-11 21:14:23.880482	2026-05-11 21:14:23.880482
99985249-19d0-4608-8d99-49e691c61949	61000000-0000-0000-0000-000000000003	2026-05-20 22:07:45	2026-05-20 22:08:19	친구와 학교 생활, 공부에 대한 이야기 나눌 수 있는 친구.	11	f	2026-05-20 22:08:28.021077	2026-05-20 22:08:28.021077
e9aca87f-cbed-4f9a-8f1b-968d9de72609	61000000-0000-0000-0000-000000000003	2026-05-20 22:11:35	2026-05-20 22:12:07	친구가 되어 이야기를 듣고 고민을 나누고 싶다는 요청.	0.5	f	2026-05-20 22:12:14.902343	2026-05-20 22:12:14.902343
c7208cda-163c-4c70-8436-adb50679af21	61000000-0000-0000-0000-000000000003	2026-05-20 22:19:27	2026-05-20 22:20:11	사람들에게 감정을 공유하는 것의 중요성에 대한 이야기.	11	f	2026-05-20 22:20:16.637351	2026-05-20 22:20:16.637351
670f2713-9ac2-4ca8-be2a-0a11ebc561cb	61000000-0000-0000-0000-000000000003	2026-05-20 22:20:41	2026-05-20 22:21:19	친구 소개, 귀 기울이는 친구, 고민 나눔, 학교 생활, 친구 관계, 스트레스, 외로움	11	f	2026-05-20 22:21:24.536088	2026-05-20 22:21:24.536088
2f2e6e2d-bee9-48dd-a4cf-525a02b24a20	61000000-0000-0000-0000-000000000003	2026-05-20 22:24:36	2026-05-20 22:25:16	친구에게 소개하는 내용으로, 블루밍은 학교 생활이나 친구 관계에 대해 이야기할 수 있는 편안한 친구로 묘사됨.	11	f	2026-05-20 22:25:24.3657	2026-05-20 22:25:24.3657
435fe6ac-f602-4766-a11c-15e1353c6645	61000000-0000-0000-0000-000000000003	2026-05-20 22:30:08	2026-05-20 22:30:34	블루밍은 힘든 일이나 고민이 있을 때 옆에서 들어주고 공감해주는 친구 같은 존재이다.	11	f	2026-05-20 22:30:42.614547	2026-05-20 22:30:42.614547
15ba4dd2-9301-4490-a259-291751277607	61000000-0000-0000-0000-000000000003	2026-05-20 22:30:41	2026-05-20 22:31:15	블루밍은 힘들 때 함께 있어줄 수 있는 따뜻한 친구로, 편안한 분위기를 만들어주고 이야기에 공감해주는 존재이다.	11	f	2026-05-20 22:31:23.186418	2026-05-20 22:31:23.186418
0ef9bafc-16b5-4a3f-a4aa-82e78f735c05	61000000-0000-0000-0000-000000000003	2026-05-20 23:40:16	2026-05-20 23:41:27	사용자가 친구에게 자기소개를 요청하고, 봇이 자신을 소개하며 항상 이야기를 들어주고 싶다고 전함.	18	f	2026-05-20 23:41:33.693514	2026-05-20 23:41:33.693514
1fbee569-b181-44e9-8852-1446cc65304b	61000000-0000-0000-0000-000000000003	2026-05-20 23:43:05	2026-05-20 23:44:23	사람들이 친구와의 관계 변화에 대해 고민하고 있으며, 친구가 함께 노는 것을 꺼리는 이유를 알아보는 것이 필요하다는 의견이 있다.	14.5	f	2026-05-20 23:44:28.673062	2026-05-20 23:44:28.673062
0443608c-938b-466c-bab6-2833bf2088f9	61000000-0000-0000-0000-000000000003	2026-05-20 23:49:13	2026-05-20 23:49:50	자기 소개 요청, 친구가 되고 싶다는 의사, 고민 나누기, 힘든 일과 기쁜 일 공유.	0.5	f	2026-05-20 23:49:56.477583	2026-05-20 23:49:56.477583
\.


--
-- Data for Name: conversation_keywords; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.conversation_keywords (keyword_id, analysis_id, user_id) FROM stdin;
15	cebd430c-3a3f-48c0-aa76-ded715bbd954	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
11	cebd430c-3a3f-48c0-aa76-ded715bbd954	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
9	cebd430c-3a3f-48c0-aa76-ded715bbd954	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
11	f6f92747-f00b-4369-809a-d473fa368249	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
15	f6f92747-f00b-4369-809a-d473fa368249	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
9	f6f92747-f00b-4369-809a-d473fa368249	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
16	94e319b4-e796-48b0-bcaa-6c2d74bcc3de	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
9	94e319b4-e796-48b0-bcaa-6c2d74bcc3de	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
10	94e319b4-e796-48b0-bcaa-6c2d74bcc3de	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
15	4eb33cd5-8f46-427a-99c2-bf799213f5b8	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e
15	3f37067c-5dbb-4680-82d9-7927a99ce225	61000000-0000-0000-0000-000000000003
9	3f37067c-5dbb-4680-82d9-7927a99ce225	61000000-0000-0000-0000-000000000003
11	3f37067c-5dbb-4680-82d9-7927a99ce225	61000000-0000-0000-0000-000000000003
15	a27248d4-b0ec-4413-9eb7-8873c206effe	61000000-0000-0000-0000-000000000003
15	1c002033-ef54-4494-acff-23aa11815f49	61000000-0000-0000-0000-000000000003
15	2e437688-e468-4120-be5f-c0c69e89b323	61000000-0000-0000-0000-000000000003
16	2e437688-e468-4120-be5f-c0c69e89b323	61000000-0000-0000-0000-000000000003
19	2e437688-e468-4120-be5f-c0c69e89b323	61000000-0000-0000-0000-000000000003
15	9c549da2-a867-4648-8689-ddc68213a559	61000000-0000-0000-0000-000000000003
10	9c549da2-a867-4648-8689-ddc68213a559	61000000-0000-0000-0000-000000000003
9	9c549da2-a867-4648-8689-ddc68213a559	61000000-0000-0000-0000-000000000003
9	36f1fc44-bce1-4516-b20d-fe43bbc87847	61000000-0000-0000-0000-000000000003
19	a59c9331-f93c-4981-a51e-7317594dbe93	61000000-0000-0000-0000-000000000003
20	3564fdd6-c70a-4beb-83d7-b1713c159182	61000000-0000-0000-0000-000000000003
9	19433bae-2e74-4041-b048-a2161c4c6b8a	61000000-0000-0000-0000-000000000003
15	d99338fb-47f5-4645-9a9c-be2c305d6982	61000000-0000-0000-0000-000000000003
15	db6726a7-ded6-4d85-8c46-f56969547204	61000000-0000-0000-0000-000000000003
12	eaf32de8-0ebb-4802-b0e3-281b556a4940	61000000-0000-0000-0000-000000000003
14	ade14f0d-db49-4d07-8363-a1cd979cf4bf	61000000-0000-0000-0000-000000000003
19	62c7e263-5f68-43ae-93c4-ab371276a2c3	61000000-0000-0000-0000-000000000003
9	fd58af14-44df-466b-a457-4a43172ef399	61000000-0000-0000-0000-000000000003
15	5b1d3546-8284-4da4-a235-30737dba54c7	61000000-0000-0000-0000-000000000003
15	5a6cc094-7482-41cf-ba5e-8d3b7fb00f4a	61000000-0000-0000-0000-000000000003
15	07c7f526-f0e3-4d4a-a71b-e2fcc5137706	61000000-0000-0000-0000-000000000003
9	25f5e30e-2cd3-4974-9b77-3471bd0face1	61000000-0000-0000-0000-000000000003
9	d38545fe-ef36-4251-b435-15512aafbd00	61000000-0000-0000-0000-000000000003
15	dccba1b8-b9ed-4ee6-a963-2f440213552c	61000000-0000-0000-0000-000000000003
20	c21a8d8c-0e32-494e-b0b7-e056621bc5fc	61000000-0000-0000-0000-000000000003
15	af58df21-84d2-4f06-b728-832126be1e11	61000000-0000-0000-0000-000000000003
15	49bb11c2-d481-48d4-8ba9-4d13517ff5c4	61000000-0000-0000-0000-000000000003
15	be87c69b-fed0-462b-865a-fffa2e3464bc	61000000-0000-0000-0000-000000000003
15	996792f2-bd94-4612-adb2-50aed4aea57e	61000000-0000-0000-0000-000000000003
15	cedb3601-228d-4c37-9139-84cdb91c1679	61000000-0000-0000-0000-000000000003
15	8b5f67c5-0ae3-468c-a737-10bb61e16c24	61000000-0000-0000-0000-000000000003
22	ce2e082f-f79e-4fd4-aa7a-cc74caef3e1c	61000000-0000-0000-0000-000000000003
9	b4bf5363-4a29-48d6-a526-49fc193d7a8e	61000000-0000-0000-0000-000000000003
15	54a699b4-7195-40e5-b7a4-d34606afa773	61000000-0000-0000-0000-000000000003
15	d75b7f97-d8eb-46cb-9f3d-b09f7b9a5e4c	61000000-0000-0000-0000-000000000003
15	9762562b-a170-49ea-b44a-9b85e3b80d0c	61000000-0000-0000-0000-000000000003
15	99985249-19d0-4608-8d99-49e691c61949	61000000-0000-0000-0000-000000000003
15	e9aca87f-cbed-4f9a-8f1b-968d9de72609	61000000-0000-0000-0000-000000000003
14	c7208cda-163c-4c70-8436-adb50679af21	61000000-0000-0000-0000-000000000003
15	670f2713-9ac2-4ca8-be2a-0a11ebc561cb	61000000-0000-0000-0000-000000000003
15	2f2e6e2d-bee9-48dd-a4cf-525a02b24a20	61000000-0000-0000-0000-000000000003
15	435fe6ac-f602-4766-a11c-15e1353c6645	61000000-0000-0000-0000-000000000003
15	15ba4dd2-9301-4490-a259-291751277607	61000000-0000-0000-0000-000000000003
15	0ef9bafc-16b5-4a3f-a4aa-82e78f735c05	61000000-0000-0000-0000-000000000003
15	1fbee569-b181-44e9-8852-1446cc65304b	61000000-0000-0000-0000-000000000003
15	0443608c-938b-466c-bab6-2833bf2088f9	61000000-0000-0000-0000-000000000003
\.


--
-- Data for Name: counselor_comments; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.counselor_comments (id, user_id, context, created_at, modified_at, parent_report_id) FROM stdin;
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1	63000000-0000-0000-0000-000000000001	Positive self-expression is increasing. Keep the evening routine predictable.	2026-05-07 22:00:00	2026-05-07 22:00:00	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2	63000000-0000-0000-0000-000000000002	Validate school anxiety and practice short calming sentences together.	2026-05-07 22:10:00	2026-05-07 22:10:00	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2
bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3	63000000-0000-0000-0000-000000000003	Peer support appears helpful. Ask about specific moments from group play.	2026-05-07 22:20:00	2026-05-07 22:20:00	aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3
38bb4675-3f2b-44ef-b675-a323e7eae2c3	63000000-0000-0000-0000-000000000001	가끔은 부모님의 따끔한 체벌이 도움이 될 수 있습니다.	2026-05-16 21:10:02.163595	2026-05-16 21:10:02.163595	29a4eaed-3d69-4313-9179-5b937ecefcfe
d9418deb-671f-4b31-af27-97c246408753	63000000-0000-0000-0000-000000000001	다시싯	2026-05-16 21:14:04.35216	2026-05-16 21:14:04.35216	7cf1277c-4ae9-446f-8cdd-8651f485588b
49d094d3-802a-4694-a069-402a5a7c9ba8	63000000-0000-0000-0000-000000000003	좋습니다!	2026-05-19 14:27:16.749308	2026-05-19 14:27:16.749308	faf6e353-8ac1-4024-a165-d9213d67e2c6
013ebad6-ae4d-416d-860b-9345a36868f4	63000000-0000-0000-0000-000000000003	그랬군요 인내심을 가지고 잘 얘기를 들어주시길 바랍니다	2026-05-19 15:01:33.16138	2026-05-19 15:01:33.16138	aa37a4c6-7e0f-46b9-9f21-3fcd6300b8c7
af779d9d-05ad-403e-8101-2eed6b52724a	63000000-0000-0000-0000-000000000003	조금 더 시간을 가지고 지켜봐요	2026-05-19 15:41:08.706205	2026-05-19 15:41:08.706205	52026450-b205-4777-bea3-4ac62c4cb23f
\.


--
-- Data for Name: diaries; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.diaries (id, user_id, diary_date, content, created_at, modified_at, emotion_icon_id) FROM stdin;
cccccccc-cccc-cccc-cccc-ccccccccccc1	61000000-0000-0000-0000-000000000001	2026-05-01	I drew a flower in art class and felt proud when the teacher smiled.	2026-05-01 20:30:00	2026-05-01 20:30:00	1
cccccccc-cccc-cccc-cccc-ccccccccccc2	61000000-0000-0000-0000-000000000001	2026-05-02	A friend spoke sharply, but talking with my parent helped me feel better.	2026-05-02 21:00:00	2026-05-02 21:00:00	2
cccccccc-cccc-cccc-cccc-ccccccccccc3	61000000-0000-0000-0000-000000000002	2026-05-01	My stomach hurt in the morning, but school felt a little easier later.	2026-05-01 20:40:00	2026-05-01 20:40:00	3
cccccccc-cccc-cccc-cccc-ccccccccccc4	61000000-0000-0000-0000-000000000002	2026-05-02	Eating lunch with a friend made me feel more comfortable.	2026-05-02 20:50:00	2026-05-02 20:50:00	1
cccccccc-cccc-cccc-cccc-ccccccccccc5	61000000-0000-0000-0000-000000000003	2026-05-01	I rode my bike in the park. The cool wind felt nice.	2026-05-01 19:40:00	2026-05-01 19:40:00	4
cccccccc-cccc-cccc-cccc-ccccccccccc6	61000000-0000-0000-0000-000000000003	2026-05-02	I lost at soccer, but my friends checked on me and I was thankful.	2026-05-02 20:20:00	2026-05-02 20:20:00	1
\.


--
-- Data for Name: diary_analysis; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.diary_analysis (id, user_id, target_date, emotion_icon, embedding_text, prediction, created_at, modified_at) FROM stdin;
1135f991-accc-49dc-a012-327d1f158675	61000000-0000-0000-0000-000000000003	2026-05-17 00:00:00	calm	우울하고 무기력하며 주말이 끝나는 것이 아쉽다.	11.15	2026-05-20 14:58:15.41063	2026-05-20 14:58:15.41063
895ff308-acb4-45dd-98d6-3b0891bfa4a7	61000000-0000-0000-0000-000000000003	2026-05-16 00:00:00	tired	지친다. 돌아다녀야 해서 힘들고, 잘 못하는 일을 하고 있다.	18.3	2026-05-20 14:59:53.307576	2026-05-20 14:59:53.307576
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5	61000000-0000-0000-0000-000000000003	2026-05-01 19:40:00	excited	outdoor activity and high energy	5.3	2026-05-01 19:41:00	2026-05-01 19:41:00
aa1bfd63-d3f3-4660-84b3-7cd9c30d065d	61000000-0000-0000-0000-000000000001	2026-05-16 00:00:00	tired	주말이 되어 힘든 평일을 잊고 쉬고 싶어.	10.5	2026-05-20 11:16:29.068997	2026-05-20 11:16:29.068997
b4461016-6519-4b7e-8d0e-bb85dd89ca5f	61000000-0000-0000-0000-000000000001	2026-05-15 00:00:00	angry	평일 근무가 힘들고 불금에 놀러가지 못해 스트레스가 쌓임.	10.5	2026-05-20 11:17:08.035987	2026-05-20 11:17:08.035987
3f6248b9-34a3-4b8e-9fbd-d899ab588243	61000000-0000-0000-0000-000000000005	2026-05-15 00:00:00	calm	wrfeagfdsfdaf	3.5	2026-05-17 21:42:10.823349	2026-05-17 21:42:10.823349
f6fe69fb-5d3f-491e-8bec-195d4db0d505	61000000-0000-0000-0000-000000000004	2026-05-17 00:00:00	calm	로댜너텃가아애댕랴챠철루루루룰수구라레랭ㄱ ㄱ 후처재걸더넝 ㅓ덩 ㄱdjejw0fbfbdfodbd d d fjsjch h isbd dhfdd xkdksd d D G G G Fg Hmfkff G G G F F F F F F G G G G H H H H H H G G F F F F Ff f ffjfjci i icns cdkxkc Sodkc Kdf fkc d Dkf docf	3.5	2026-05-17 21:42:25.150461	2026-05-17 21:42:25.150461
bea72faf-512c-48fb-a223-51fd3b5740ef	61000000-0000-0000-0000-000000000001	2026-05-14 00:00:00	sad	개발한 것이 작동하지 않아 고민 중이다.	10.5	2026-05-20 11:17:28.981684	2026-05-20 11:17:28.981684
ca31a4e2-c2ed-4fd8-878c-c76c0afa27c8	61000000-0000-0000-0000-000000000002	2026-05-13 00:00:00	excited	나 행복해.	17.5	2026-05-19 13:18:09.082485	2026-05-19 13:18:09.082485
30911538-ca63-48f4-a605-0c87b27bf0d9	61000000-0000-0000-0000-000000000002	2026-05-19 00:00:00	excited	오늘은 화창하고 여름 같은 날씨여서 시간이 참 빠르게 느껴진다.	17.5	2026-05-19 13:18:44.350769	2026-05-19 13:18:52.142535
33ab90b4-14ba-4a22-982a-b97f3ebde366	61000000-0000-0000-0000-000000000002	2026-05-18 00:00:00	happy	오늘은 정말 너무 행복해서 기분이 최고인 하루야.	10.5	2026-05-19 13:40:11.846811	2026-05-19 13:40:11.846811
4e8e1bf1-5e46-4f52-b2ac-7e948027a431	61000000-0000-0000-0000-000000000003	2026-05-05 00:00:00	happy	오늘은 어린이날이라 '우리들 세상'이라며 신나하는 표현.	10.5	2026-05-19 13:58:09.820206	2026-05-19 13:58:09.820206
10c464ea-6cc3-4178-b757-359b4a3d9a05	61000000-0000-0000-0000-000000000003	2026-05-06 00:00:00	sad	오늘은 쉬다가 학교에 가야 해서 아침부터 기분이 좋지 않고 학교 가기 싫어 그냥 집에 있고 싶다.	10.5	2026-05-19 13:59:46.879565	2026-05-19 13:59:46.879565
b90db3ec-6a6d-46b8-b065-8591fe4e9860	61000000-0000-0000-0000-000000000003	2026-05-10 00:00:00	sad	내일이 월요일이라 주말이 없어져 버린 기분이고 힘들어서 학교 가기 싫다.	10.5	2026-05-19 14:01:18.598704	2026-05-19 14:01:18.598704
866cbd39-5b89-47af-bfb6-6dafbe713f16	61000000-0000-0000-0000-000000000003	2026-05-03 00:00:00	sad	내일이 월요일이라 학교에 가기 싫다고 투덜거리고 있다.	10.5	2026-05-19 14:28:57.566265	2026-05-19 14:28:57.566265
77f68c83-a456-4f12-8b81-cc94216d898a	61000000-0000-0000-0000-000000000003	2026-05-12 00:00:00	calm	별일 없이 심심한 하루, 학교에서 친구들과 공부.	10.82	2026-05-20 15:05:30.114155	2026-05-20 15:05:30.114155
4d0d8714-615b-4d11-86ff-b4060c7e4494	61000000-0000-0000-0000-000000000003	2026-05-15 00:00:00	happy	수업 후 친구들과 저녁에 놀았다. 신난다.	0.29	2026-05-20 15:05:47.38172	2026-05-20 15:05:47.38172
c2b15d98-7cb6-4ae2-b984-5c4d7a9bae07	61000000-0000-0000-0000-000000000003	2026-05-18 00:00:00	angry	월요일 아침에 학교에 가야 해서 화가 나고, 문제도 잘 안 풀려서 답답하다.	10.94	2026-05-20 15:06:41.047432	2026-05-20 15:06:41.047432
15a85280-0b94-43d0-80b2-0ba025f6aaf2	61000000-0000-0000-0000-000000000003	2026-05-11 00:00:00	tired	월요일, 학교 가기 싫음.	10.81	2026-05-20 15:09:00.737737	2026-05-20 15:09:00.737737
3ed94566-1eba-4392-8920-2a2bae2bf366	61000000-0000-0000-0000-000000000003	2026-05-14 00:00:00	happy	평안한 하루였다.	0.31	2026-05-20 15:40:37.361544	2026-05-20 15:40:37.361544
3df7956f-e32e-4701-ade7-2cb8d9bdc7f1	61000000-0000-0000-0000-000000000003	2026-05-13 00:00:00	calm	어제와 다를거 없는 하루였다.	0.57	2026-05-20 15:53:12.933269	2026-05-20 15:53:12.933269
c4c4b5b9-e4c1-43a6-83f6-6e18fe76de81	61000000-0000-0000-0000-000000000003	2026-05-19 00:00:00	sad	잠을 못 자고 힘들며, 시험 성적이 좋지 않다.	17.78	2026-05-20 15:07:46.074363	2026-05-20 15:07:46.074363
65f40ca2-7ffc-4d18-a05f-ec9b0bf235d2	61000000-0000-0000-0000-000000000001	2026-05-20 00:00:00	angry	행복하다	0.21	2026-05-20 13:42:29.667064	2026-05-20 13:42:29.667064
b8435d12-e98c-411b-a265-78adbebd1d7d	61000000-0000-0000-0000-000000000003	2026-05-20 00:00:00	tired	비가 와서 아침이 어두웠고, 늦게 일어나 지각했다. 신발이 젖어서 우울하다.	16.7	2026-05-20 14:52:30.702004	2026-05-20 14:52:30.702004
1b3aa20d-4051-4f32-8d76-4868a1b6da10	61000000-0000-0000-0000-000000000001	2026-05-13 00:00:00	calm	문화의 날이라 영화 보러 가고 싶어. 저녁에 심심해.	4.3	2026-05-20 11:18:08.434102	2026-05-20 11:18:08.434102
17eb0d51-a380-460d-9916-3482eb5e8c6a	61000000-0000-0000-0000-000000000001	2026-05-17 00:00:00	excited	친구들과 핫플에 갔다.	0.3	2026-05-20 11:15:54.511116	2026-05-20 11:15:54.511116
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2	61000000-0000-0000-0000-000000000001	2026-05-02 21:00:00	sad	peer conflict followed by parent support	18.5	2026-05-02 21:01:00	2026-05-02 21:01:00
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1	61000000-0000-0000-0000-000000000001	2026-05-01 20:30:00	happy	art activity, praise, positive self expression	4.2	2026-05-01 20:31:00	2026-05-01 20:31:00
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4	61000000-0000-0000-0000-000000000002	2026-05-02 20:50:00	happy	friend lunch and comfort	4.1	2026-05-02 20:51:00	2026-05-02 20:51:00
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3	61000000-0000-0000-0000-000000000002	2026-05-01 20:40:00	calm	school tension and later stabilization	5	2026-05-01 20:41:00	2026-05-01 20:41:00
eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6	61000000-0000-0000-0000-000000000003	2026-05-02 20:20:00	happy	loss after soccer and peer support	4.2	2026-05-02 20:21:00	2026-05-02 20:21:00
585450ca-7fad-4356-97e9-c5c5e69c0f31	61000000-0000-0000-0000-000000000003	2026-05-04 00:00:00	excited	내일 학교 안 가는 게 너무 좋다 ㅎㅎㅎ	4.1	2026-05-19 13:58:54.908003	2026-05-19 13:58:54.908003
0a542b4a-d847-48df-8645-bd1d7d1ab5b8	61000000-0000-0000-0000-000000000003	2026-05-08 00:00:00	calm	모든 게 다 귀찮다.	17	2026-05-19 14:00:15.398443	2026-05-19 14:00:15.398443
8b4aa5b9-e04d-4326-b46f-322e32e34a8c	61000000-0000-0000-0000-000000000001	2026-05-19 00:00:00	excited	일기가 잘 작동하길 바라며, 엄마와 맛있는 음식을 먹었다.	3.5	2026-05-20 11:15:19.061197	2026-05-20 11:15:19.061197
2633f6b6-38cb-46ba-a1d9-33ecae311438	61000000-0000-0000-0000-000000000001	2026-05-18 00:00:00	calm	월요일, 주말이 그립다.	5.6	2026-05-20 11:15:35.401757	2026-05-20 11:15:35.401757
\.


--
-- Data for Name: diary_emotions; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.diary_emotions (id, user_id, diary_date, created_at, modified_at, emotion_icon_id) FROM stdin;
dddddddd-dddd-dddd-dddd-dddddddddd01	61000000-0000-0000-0000-000000000001	2026-05-01	2026-05-01 20:30:00	2026-05-01 20:30:00	1
dddddddd-dddd-dddd-dddd-dddddddddd02	61000000-0000-0000-0000-000000000001	2026-05-02	2026-05-02 21:00:00	2026-05-02 21:00:00	2
dddddddd-dddd-dddd-dddd-dddddddddd03	61000000-0000-0000-0000-000000000002	2026-05-01	2026-05-01 20:40:00	2026-05-01 20:40:00	3
dddddddd-dddd-dddd-dddd-dddddddddd04	61000000-0000-0000-0000-000000000002	2026-05-02	2026-05-02 20:50:00	2026-05-02 20:50:00	1
dddddddd-dddd-dddd-dddd-dddddddddd05	61000000-0000-0000-0000-000000000003	2026-05-01	2026-05-01 19:40:00	2026-05-01 19:40:00	4
dddddddd-dddd-dddd-dddd-dddddddddd06	61000000-0000-0000-0000-000000000003	2026-05-02	2026-05-02 20:20:00	2026-05-02 20:20:00	1
\.


--
-- Data for Name: diary_keywords; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.diary_keywords (keyword_id, analysis_id, user_id) FROM stdin;
9	c2b15d98-7cb6-4ae2-b984-5c4d7a9bae07	61000000-0000-0000-0000-000000000003
8	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1	61000000-0000-0000-0000-000000000001
1	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2	61000000-0000-0000-0000-000000000001
5	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3	61000000-0000-0000-0000-000000000002
1	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4	61000000-0000-0000-0000-000000000002
6	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5	61000000-0000-0000-0000-000000000003
1	eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6	61000000-0000-0000-0000-000000000003
22	c4c4b5b9-e4c1-43a6-83f6-6e18fe76de81	61000000-0000-0000-0000-000000000003
9	15a85280-0b94-43d0-80b2-0ba025f6aaf2	61000000-0000-0000-0000-000000000003
15	3ed94566-1eba-4392-8920-2a2bae2bf366	61000000-0000-0000-0000-000000000003
17	3f6248b9-34a3-4b8e-9fbd-d899ab588243	61000000-0000-0000-0000-000000000005
15	f6fe69fb-5d3f-491e-8bec-195d4db0d505	61000000-0000-0000-0000-000000000004
11	3df7956f-e32e-4701-ade7-2cb8d9bdc7f1	61000000-0000-0000-0000-000000000003
11	ca31a4e2-c2ed-4fd8-878c-c76c0afa27c8	61000000-0000-0000-0000-000000000002
14	ca31a4e2-c2ed-4fd8-878c-c76c0afa27c8	61000000-0000-0000-0000-000000000002
18	ca31a4e2-c2ed-4fd8-878c-c76c0afa27c8	61000000-0000-0000-0000-000000000002
19	30911538-ca63-48f4-a605-0c87b27bf0d9	61000000-0000-0000-0000-000000000002
11	33ab90b4-14ba-4a22-982a-b97f3ebde366	61000000-0000-0000-0000-000000000002
11	4e8e1bf1-5e46-4f52-b2ac-7e948027a431	61000000-0000-0000-0000-000000000003
9	585450ca-7fad-4356-97e9-c5c5e69c0f31	61000000-0000-0000-0000-000000000003
9	10c464ea-6cc3-4178-b757-359b4a3d9a05	61000000-0000-0000-0000-000000000003
19	10c464ea-6cc3-4178-b757-359b4a3d9a05	61000000-0000-0000-0000-000000000003
20	10c464ea-6cc3-4178-b757-359b4a3d9a05	61000000-0000-0000-0000-000000000003
16	0a542b4a-d847-48df-8645-bd1d7d1ab5b8	61000000-0000-0000-0000-000000000003
20	0a542b4a-d847-48df-8645-bd1d7d1ab5b8	61000000-0000-0000-0000-000000000003
19	0a542b4a-d847-48df-8645-bd1d7d1ab5b8	61000000-0000-0000-0000-000000000003
19	b90db3ec-6a6d-46b8-b065-8591fe4e9860	61000000-0000-0000-0000-000000000003
21	b90db3ec-6a6d-46b8-b065-8591fe4e9860	61000000-0000-0000-0000-000000000003
9	b90db3ec-6a6d-46b8-b065-8591fe4e9860	61000000-0000-0000-0000-000000000003
9	866cbd39-5b89-47af-bfb6-6dafbe713f16	61000000-0000-0000-0000-000000000003
21	866cbd39-5b89-47af-bfb6-6dafbe713f16	61000000-0000-0000-0000-000000000003
13	866cbd39-5b89-47af-bfb6-6dafbe713f16	61000000-0000-0000-0000-000000000003
11	8b4aa5b9-e04d-4326-b46f-322e32e34a8c	61000000-0000-0000-0000-000000000001
14	2633f6b6-38cb-46ba-a1d9-33ecae311438	61000000-0000-0000-0000-000000000001
15	17eb0d51-a380-460d-9916-3482eb5e8c6a	61000000-0000-0000-0000-000000000001
19	aa1bfd63-d3f3-4660-84b3-7cd9c30d065d	61000000-0000-0000-0000-000000000001
19	b4461016-6519-4b7e-8d0e-bb85dd89ca5f	61000000-0000-0000-0000-000000000001
20	bea72faf-512c-48fb-a223-51fd3b5740ef	61000000-0000-0000-0000-000000000001
19	1b3aa20d-4051-4f32-8d76-4868a1b6da10	61000000-0000-0000-0000-000000000001
11	65f40ca2-7ffc-4d18-a05f-ec9b0bf235d2	61000000-0000-0000-0000-000000000001
14	b8435d12-e98c-411b-a265-78adbebd1d7d	61000000-0000-0000-0000-000000000003
14	1135f991-accc-49dc-a012-327d1f158675	61000000-0000-0000-0000-000000000003
19	895ff308-acb4-45dd-98d6-3b0891bfa4a7	61000000-0000-0000-0000-000000000003
9	77f68c83-a456-4f12-8b81-cc94216d898a	61000000-0000-0000-0000-000000000003
15	4d0d8714-615b-4d11-86ff-b4060c7e4494	61000000-0000-0000-0000-000000000003
\.


--
-- Data for Name: emotion_icon; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.emotion_icon (id, name) FROM stdin;
1	happy
2	sad
3	calm
4	excited
5	tired
6	angry
\.


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success) FROM stdin;
1	1	init report schema	SQL	V1__init_report_schema.sql	-2006523309	rebloom	2026-05-15 13:17:39.279081	347	t
2	2	add counselor comment flag	SQL	V2__add_counselor_comment_flag.sql	-1854064628	rebloom	2026-05-15 13:17:39.920374	14	t
3	3	drop conversation analysis emotion icon	SQL	V3__drop_conversation_analysis_emotion_icon.sql	-1075678195	rebloom	2026-05-15 13:17:39.9621	16	t
4	4	add status card	SQL	V4__add_status_card.sql	-598318136	rebloom	2026-05-18 12:59:35.853861	107	t
5	5	change analysis prediction to double	SQL	V5__change_analysis_prediction_to_double.sql	-2024892952	rebloom	2026-05-18 21:30:38.220192	83	t
6	6	change analysis prediction to double	SQL	V6__change_analysis_prediction_to_double.sql	-2024892952	rebloom	2026-05-18 21:30:38.35592	20	t
7	7	normalize analysis prediction scores	SQL	V7__normalize_analysis_prediction_scores.sql	1000312740	rebloom	2026-05-19 12:59:34.753686	757	t
8	8	create shedlock table	SQL	V8__create_shedlock_table.sql	-2095609245	rebloom	2026-05-20 15:43:39.258163	310	t
\.


--
-- Data for Name: recent_trend; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.recent_trend (id, user_id, report_date, summary) FROM stdin;
99999999-9999-9999-9999-999999999991	61000000-0000-0000-0000-000000000001	2026-05-07	Positive recovery patterns increased, with occasional school anxiety signals.
99999999-9999-9999-9999-999999999992	61000000-0000-0000-0000-000000000002	2026-05-07	Peer relationship tension was recorded, but stabilizing experiences were also present.
99999999-9999-9999-9999-999999999993	61000000-0000-0000-0000-000000000003	2026-05-07	Outdoor activity and peer support are connected with positive emotion.
88537635-bb72-4f86-b62b-d4c68f9e63ac	00000000-0000-0000-0000-000000000001	2026-05-18	2026년 5월 11일부터 5월 17일까지의 분석 데이터가 없으므로, 아동 우울증 단계의 최근 경향을 파악할 수 없습니다.
5dae9a42-c052-49d8-a3bc-e4a61de74f87	bac71d57-f908-4d8a-9a7a-e1a0c71a55c9	2026-05-19	2026년 5월 12일부터 5월 18일까지의 아동 우울증 단계 추세는 분석 데이터가 없어 명확한 신호를 파악하기 어렵다.
2b996a34-cbca-4bac-83bd-ee887b115650	61000000-0000-0000-0000-000000000002	2026-05-18	2026년 5월 11일부터 5월 17일까지의 아동 우울증 단계 추세는 최소에서 경미, 중간, 심각으로 진행되지 않은 것으로 나타났다.
6272325f-b9b9-4bec-8c12-88516c9d0ca9	61000000-0000-0000-0000-000000000004	2026-05-18	2026년 5월 11일부터 5월 17일까지의 분석 데이터가 없으므로 최근 아동 우울증 단계 추세를 파악할 수 없습니다.
fe41a1e6-f5ed-45c6-88cb-dda47986b7fb	61000000-0000-0000-0000-000000000003	2026-05-18	2026년 5월 11일부터 5월 17일까지의 아동 우울증 단계 추세는 최소에서 경미, 중간, 심각으로 진행되지 않았습니다.
b3bd960c-5dd2-4795-94b1-d501202b39cc	61000000-0000-0000-0000-000000000005	2026-05-18	2026년 5월 11일부터 5월 17일까지의 기간 동안 아동 우울증 단계에서 최소, 경미, 중간, 심각 단계의 데이터가 존재하지 않아 추세를 분석할 수 없습니다.
320ee2a9-7a58-4da2-9b69-bc90d4d68c06	61000000-0000-0000-0000-000000000006	2026-05-18	2026년 5월 11일부터 5월 17일까지의 분석 데이터가 없으므로, 아동 우울증 단계의 최근 경향을 파악할 수 없습니다.
b7852af9-1e8c-4fbb-91de-ba5d6a6c04a0	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-18	2026년 5월 11일부터 5월 17일 사이에 아동 우울증 단계는 경미한 단계에서 심각한 단계로 급격히 증가하였다.
fcea9877-b522-4496-81c6-9c9b554ec0b7	b06723a2-7396-4805-b311-189dba52396a	2026-05-18	2026년 5월 11일부터 5월 17일까지의 기간 동안 아동 우울증 단계는 최소에서 경미, 중간, 심각으로의 변화가 관찰되지 않았다.
1b45ed8e-6f72-42a2-85bd-77e9ea0bfc22	bac71d57-f908-4d8a-9a7a-e1a0c71a55c9	2026-05-18	2026년 5월 11일부터 5월 17일까지의 분석 데이터가 없으므로 아동 우울증 단계 추세를 요약할 수 없습니다.
4565bade-17be-4dd9-9b8c-045816510247	61000000-0000-0000-0000-000000000001	2026-05-19	2026년 5월 12일부터 18일까지의 아동 우울증 단계 추세는 점진적으로 증가하여 5월 17일에 최고점인 3.0에 도달하였다.
c03fe0d3-8ae2-4f9e-ad68-99ba186031e5	61000000-0000-0000-0000-000000000002	2026-05-19	2026년 5월 12일부터 5월 18일까지의 아동 우울증 단계 추세는 분석 데이터가 없어 명확한 신호를 파악할 수 없습니다.
a3627a3f-4e13-4668-a01d-16ac3e37d63f	61000000-0000-0000-0000-000000000003	2026-05-19	2026년 5월 12일부터 5월 18일까지의 아동 우울증 단계 추세는 분석 데이터가 없어 명확한 신호를 파악하기 어렵다.
6f01384c-471d-418e-928c-27aa48a60141	61000000-0000-0000-0000-000000000004	2026-05-19	2026년 5월 12일부터 5월 18일 사이의 아동 우울증 단계 추세는 5월 17일에 일일 최대 점수가 0.0으로 나타나 우울 신호가 매우 약함을 보여줍니다.
c3bd196f-be3c-45ac-b824-b648246eacd8	61000000-0000-0000-0000-000000000006	2026-05-19	2026년 5월 12일부터 5월 18일까지의 아동 우울증 단계 추세는 분석 데이터가 없어 명확한 신호를 파악하기 어려운 상황입니다.
12b18377-4b0d-4d26-b4d6-2cb595b41aa8	61000000-0000-0000-0000-000000000005	2026-05-19	2026년 5월 12일부터 5월 18일까지의 최근 아동 우울증 단계 추세는 전반적으로 우울 신호가 약한 것으로 나타났다.
7ed8a723-98ec-4e98-80de-a50e363916be	8932ec31-2e23-4a20-8b9d-9d0bc13ab01e	2026-05-19	2026년 5월 12일부터 18일 사이 아동 우울증 지표는 지속적으로 낮은 수준을 유지하며, 대화 및 일일 최대 점수가 모두 3.0으로 나타났다.
746ad1f3-b898-456c-8f0b-399f2b01ed63	61000000-0000-0000-0000-000000000001	2026-05-18	2026년 5월 11일부터 17일 사이에 아동 우울증 단계가 경증에서 중증으로 급격히 악화되었다.
\.


--
-- Data for Name: shedlock; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.shedlock (name, lock_until, locked_at, locked_by) FROM stdin;
\.


--
-- Data for Name: status_cards; Type: TABLE DATA; Schema: public; Owner: rebloom
--

COPY public.status_cards (id, user_id, date, title, description, sub_title, suggestion, created_at, modified_at) FROM stdin;
2	61000000-0000-0000-0000-000000000001	2026-05-18	지민이가 조금 지쳐 있는 것 같아요	수면 질이 평소보다 좋지 않고, 활동량이 저번주에 비해 줄어들었어요.	직접적인 상태 질문보다 가벼운 제안이 좋습니다. 	오늘 저녁에 같이 맛있는 거 먹을까?	2026-05-18 06:19:31.862303	2026-05-18 06:19:31.862303
1	61000000-0000-0000-0000-000000000003	2026-05-19	오늘 아이의 수면과 회복 흐름	지난 며칠간 수면 시간이 비교적 일정하고 수면 점수도 대체로 양호해 밤사이 회복이 잘 이루어지는 흐름이 보여요. 다만 낮 동안 짧게 심박과 활동량이 급히 오른 기록이 있어 잠깐 에너지가 많이 움직였던 것 같아요.	오늘의 작은 제안	자기 전 함께 천천히 숨 고르기 한 번 해볼래?	2026-05-19 17:46:21.656859	2026-05-19 17:46:21.656859
\.


--
-- Name: analysis_keywords_keyword_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.analysis_keywords_keyword_id_seq', 22, true);


--
-- Name: emotion_icon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.emotion_icon_id_seq', 6, true);


--
-- Name: status_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rebloom
--

SELECT pg_catalog.setval('public.status_cards_id_seq', 1, true);


--
-- Name: analysis_keywords analysis_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.analysis_keywords
    ADD CONSTRAINT analysis_keywords_pkey PRIMARY KEY (keyword_id);


--
-- Name: children_reports children_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.children_reports
    ADD CONSTRAINT children_reports_pkey PRIMARY KEY (id);


--
-- Name: conversation_analysis conversation_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.conversation_analysis
    ADD CONSTRAINT conversation_analysis_pkey PRIMARY KEY (id, user_id);


--
-- Name: conversation_keywords conversation_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.conversation_keywords
    ADD CONSTRAINT conversation_keywords_pkey PRIMARY KEY (keyword_id, analysis_id, user_id);


--
-- Name: counselor_comments counselor_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.counselor_comments
    ADD CONSTRAINT counselor_comments_pkey PRIMARY KEY (id);


--
-- Name: diaries diaries_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diaries
    ADD CONSTRAINT diaries_pkey PRIMARY KEY (id);


--
-- Name: diary_analysis diary_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_analysis
    ADD CONSTRAINT diary_analysis_pkey PRIMARY KEY (id, user_id);


--
-- Name: diary_emotions diary_emotions_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_emotions
    ADD CONSTRAINT diary_emotions_pkey PRIMARY KEY (id);


--
-- Name: diary_keywords diary_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_keywords
    ADD CONSTRAINT diary_keywords_pkey PRIMARY KEY (keyword_id, analysis_id, user_id);


--
-- Name: emotion_icon emotion_icon_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.emotion_icon
    ADD CONSTRAINT emotion_icon_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: recent_trend recent_trend_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.recent_trend
    ADD CONSTRAINT recent_trend_pkey PRIMARY KEY (id, user_id);


--
-- Name: shedlock shedlock_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.shedlock
    ADD CONSTRAINT shedlock_pkey PRIMARY KEY (name);


--
-- Name: status_cards status_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.status_cards
    ADD CONSTRAINT status_cards_pkey PRIMARY KEY (id);


--
-- Name: counselor_comments uk_counselor_comments_parent_report; Type: CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.counselor_comments
    ADD CONSTRAINT uk_counselor_comments_parent_report UNIQUE (parent_report_id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: rebloom
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: conversation_keywords fk_conversation_keywords_analysis; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.conversation_keywords
    ADD CONSTRAINT fk_conversation_keywords_analysis FOREIGN KEY (analysis_id, user_id) REFERENCES public.conversation_analysis(id, user_id);


--
-- Name: conversation_keywords fk_conversation_keywords_keyword; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.conversation_keywords
    ADD CONSTRAINT fk_conversation_keywords_keyword FOREIGN KEY (keyword_id) REFERENCES public.analysis_keywords(keyword_id);


--
-- Name: counselor_comments fk_counselor_comments_children_reports; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.counselor_comments
    ADD CONSTRAINT fk_counselor_comments_children_reports FOREIGN KEY (parent_report_id) REFERENCES public.children_reports(id);


--
-- Name: diaries fk_diaries_emotion_icon; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diaries
    ADD CONSTRAINT fk_diaries_emotion_icon FOREIGN KEY (emotion_icon_id) REFERENCES public.emotion_icon(id);


--
-- Name: diary_emotions fk_diary_emotions_emotion_icon; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_emotions
    ADD CONSTRAINT fk_diary_emotions_emotion_icon FOREIGN KEY (emotion_icon_id) REFERENCES public.emotion_icon(id);


--
-- Name: diary_keywords fk_diary_keywords_analysis; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_keywords
    ADD CONSTRAINT fk_diary_keywords_analysis FOREIGN KEY (analysis_id, user_id) REFERENCES public.diary_analysis(id, user_id);


--
-- Name: diary_keywords fk_diary_keywords_keyword; Type: FK CONSTRAINT; Schema: public; Owner: rebloom
--

ALTER TABLE ONLY public.diary_keywords
    ADD CONSTRAINT fk_diary_keywords_keyword FOREIGN KEY (keyword_id) REFERENCES public.analysis_keywords(keyword_id);


--
-- PostgreSQL database dump complete
--

\unrestrict zAXaiOfQLr2tpHJB0QXi0ZiRcWlzBGKw7nMzE4fKKzOMC4hFDiewAgDt0XcwUIm

--
-- PostgreSQL database cluster dump complete
--

