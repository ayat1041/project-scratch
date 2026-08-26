# postgres_docker Role

This role runs a PostgreSQL database inside Docker.

## Variables

See `defaults/main.yml` for all available vars. Override `postgres_user`, `postgres_password`, and `postgres_db` in `group_vars`/`host_vars`.

## Example Playbook

```yaml
- name: Deploy Postgres
  hosts: db
  become: true
  roles:
    - role: postgres_docker
      vars:
        postgres_user: "produser"
        postgres_password: "{{ vault_postgres_password }}"
        postgres_db: "proddb"
```
