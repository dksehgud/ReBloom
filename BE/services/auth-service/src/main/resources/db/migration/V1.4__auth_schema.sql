ALTER TABLE auth_schema.users ALTER COLUMN role TYPE VARCHAR;

DROP TYPE auth_schema.user_role;

CREATE TYPE auth_schema.user_role AS ENUM ('CHILDREN', 'PARENT', 'COUNSELOR');

ALTER TABLE auth_schema.users
ALTER COLUMN role TYPE auth_schema.user_role
    USING (role::auth_schema.user_role);