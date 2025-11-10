#!/bin/sh
set -xe

# replaced with a github app
# deploy key method not working

# # Start ssh-agent
# eval "$(ssh-agent -s)"

# if [ -f /ssh/id_rsa ]; then
#     ssh-add /ssh/id_rsa

#     cat <<EOF > /etc/ssh/ssh_config
# Host ssh.github.com
#     AddKeysToAgent yes
#     IdentityFile /ssh/id_rsa
#     IgnoreUnknown UseKeychain
# EOF

#     cat /etc/ssh/ssh_config
#     cat /ssh/id_rsa

#  not authenticated with the github deploy-key
#     ssh -T -p 443 git@ssh.github.com

#     git config --local user.email "dev.edrlab@gmail.com"
#     git config --local user.name "dev.edrlab"

# fi

# Run your main app
exec "$@"