# Ansible Vault Reference

## What is Ansible Vault?

Ansible Vault is a built-in AES-256 encryption tool. It encrypts a file so the
contents are unreadable without a vault password. The encrypted file is safe to
commit to git — without the password it is useless to anyone.

An encrypted vault file looks like this on disk:

```
$ANSIBLE_VAULT;1.1;AES256
65386362653832303338663337623966333338306362623531343166353839323435
39623133623539313665663865396130393766373963323838343035643432313834
...
```

---

## Two things people confuse

| Thing | What it is | Where it lives |
|---|---|---|
| **Vault file** (`app_vault.yml`) | Encrypted file containing secret values | Committed to git (encrypted) |
| **Vault password** | Password used to encrypt / decrypt the vault file | Never committed — local only |

---

## Vault file for this project

```
inventory/host_vars/app_vault.yml        ← encrypted, committed to git
inventory/host_vars/app_vault.yml.example ← plaintext template, committed to git
```

The vault file holds these five variables, referenced in `app.yml`:

| Variable | Used for |
|---|---|
| `vault_admin_user_password` | Linux admin user password (hashed via `password_hash('sha512')`) |
| `vault_email_smtp_password` | Mailtrap SMTP API key |
| `vault_postgres_password` | PostgreSQL container password |
| `vault_redis_password` | Redis container password |
| `vault_rabbitmq_password` | RabbitMQ container password |

---

## One-time setup

### 1. Create the vault file from the example

```bash
cd infra/ansible
cp inventory/host_vars/app_vault.yml.example inventory/host_vars/app_vault.yml
```

### 2. Fill in real values

```yaml
vault_admin_user_password: "your-linux-password"
vault_email_smtp_password: "your-mailtrap-api-key"
vault_postgres_password:   "your-postgres-password"
vault_redis_password:      "your-redis-password"
vault_rabbitmq_password:   "your-rabbitmq-password"
```

### 3. Encrypt it

```bash
ansible-vault encrypt inventory/host_vars/app_vault.yml
# New Vault password: ••••••••
# Confirm New Vault password: ••••••••
```

### 4. Commit the encrypted file

```bash
git add -f inventory/host_vars/app_vault.yml
git commit -m "chore: add encrypted vault for app"
```

The `.gitignore` blocks `*_vault.yml` by default, so `-f` (force-add) is required
once after encryption. Subsequent `git add` calls work normally because the file
is already tracked.

---

## Vault password storage

Choose one approach and stick to it.

### Option A — Type it each run (simplest)

```bash
ansible-playbook -i inventory/hosts.yml playbooks/bootstrap.yml --ask-vault-pass
```

Prompted on every run. Fine for occasional use.

### Option B — Local password file (recommended for daily use)

```bash
echo "your-vault-password" > ~/.vault_pass
chmod 600 ~/.vault_pass
```

Add to `ansible.cfg`:

```ini
vault_password_file = ~/.vault_pass
```

Playbooks now run without being prompted. The file lives only on your machine —
`~/.vault_pass` is already in `.gitignore`.

### Option C — GitHub Actions / CI

Store the vault password as a repository secret (`ANSIBLE_VAULT_PASSWORD`), then
in the workflow:

```yaml
- name: Write vault password file
  run: echo "${{ secrets.ANSIBLE_VAULT_PASSWORD }}" > .vault_pass

- name: Run playbook
  run: ansible-playbook -i inventory/hosts.yml playbooks/site.yml --vault-password-file .vault_pass
```

---

## Day-to-day vault commands

| Task | Command |
|---|---|
| Encrypt a file | `ansible-vault encrypt inventory/host_vars/app_vault.yml` |
| Decrypt to disk (careful) | `ansible-vault decrypt inventory/host_vars/app_vault.yml` |
| View without decrypting to disk | `ansible-vault view inventory/host_vars/app_vault.yml` |
| Edit in place (re-encrypts on save) | `ansible-vault edit inventory/host_vars/app_vault.yml` |
| Change the vault password | `ansible-vault rekey inventory/host_vars/app_vault.yml` |

---

## What is NOT a secret

SSH public keys (`admin_public_key`) are safe to commit in plaintext. A public
key is the lock, not the key — anyone can have the lock. Only the private key
(`~/.ssh/id_ed25519`) must be kept off git.

---

## Running playbooks

```bash
cd infra/ansible

# First time — install Galaxy collections
ansible-galaxy collection install -r requirements.yml

# 1. Bootstrap (run once as root on a fresh server)
ansible-playbook -i inventory/hosts.yml playbooks/bootstrap.yml --ask-pass --ask-vault-pass

# 2. Install packages, Docker, Nginx
ansible-playbook -i inventory/hosts.yml playbooks/initial-setup.yml --ask-vault-pass

# 3. Harden SSH, firewall, Fail2Ban
ansible-playbook -i inventory/hosts.yml playbooks/security.yml --ask-vault-pass

# 4. Deploy PostgreSQL, Redis, and RabbitMQ containers
ansible-playbook -i inventory/hosts.yml playbooks/database.yml --ask-vault-pass

# 5. Add an Nginx vhost with SSL
ansible-playbook -i inventory/hosts.yml playbooks/add-nginx-vhost.yml --ask-vault-pass

# 5a. Add HTTP-only vhost (no certbot — for testing or pre-DNS cutover)
ansible-playbook -i inventory/hosts.yml playbooks/add-nginx-vhost.yml -e vhost_mode=temp --ask-vault-pass

# Remove a vhost
ansible-playbook -i inventory/hosts.yml playbooks/remove-nginx-vhost.yml --ask-vault-pass
```

---

## Role overview

| Role | Purpose |
|---|---|
| `base-packages` | Timezone, essential apt packages, automatic security updates |
| `docker` | Docker CE install, daemon config, log rotation |
| `nginx-base` | Nginx install, catch-all default vhost (blocks direct IP access) |
| `nginx-vhost` | Add a vhost — HTTP-only (`vhost_mode: temp`) or full SSL (`vhost_mode: ssl`) |
| `remove-nginx-vhost` | Remove a vhost from sites-available and sites-enabled |
| `security-hardening` | SSH hardening, UFW firewall, Fail2Ban, kernel sysctl, msmtp + logwatch |
| `deploy-postgres` | Run a PostgreSQL Docker container with healthcheck |
| `deploy-redis` | Run a Redis Docker container with password and renamed dangerous commands |
| `deploy-rabbitmq` | Run a RabbitMQ Docker container (management plugin) with healthcheck |

---

## Running Molecule tests

```bash
pip install -r requirements-dev.txt

# Test a single role
cd roles/base-packages && molecule test

# Test all roles
for role in roles/*/; do
  echo "=== Testing $role ==="
  (cd "$role" && molecule test)
done
```

The `nginx-vhost` molecule scenario uses `vhost_mode: temp` so certbot is skipped
and tests pass without a real domain or DNS.
