# Deploy Setup — GitHub Secrets

После настройки VPS (пользователь `deploy`, SSH-ключ, права на `/opt/vpn-suite`) остаётся добавить **GitHub Secrets** для автодеплоя.

## GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Описание | Пример |
|--------|----------|--------|
| `DEPLOY_SSH_HOST` | Hostname или IP VPS | `vpn.example.com` или `192.0.2.10` |
| `DEPLOY_SSH_USER` | Пользователь для SSH | `deploy` |
| `DEPLOY_SSH_PRIVATE_KEY` | Приватный ключ (полностью) | Содержимое `secrets/deploy_ssh_key_private` |

### Как заполнить `DEPLOY_SSH_PRIVATE_KEY`

```bash
# Локально (не коммитить вывод)
cat secrets/deploy_ssh_key_private
```

Скопировать **весь** вывод, включая строки `-----BEGIN ... KEY-----` и `-----END ... KEY-----`, и вставить в значение secret.

## Проверка

После добавления secrets workflow деплоя (при push в `beta` или `beta-release`) сможет:

1. Подключиться по SSH к VPS
2. Выполнить `cd /opt/vpn-suite && git pull && ./manage.sh up-core` (или аналог)

## Безопасность

- Не коммитить `secrets/deploy_ssh_key_private` в git (должен быть в `.gitignore`)
- Ротация ключа: сгенерировать новую пару, обновить `~deploy/.ssh/authorized_keys` на VPS, обновить secret `DEPLOY_SSH_PRIVATE_KEY`
