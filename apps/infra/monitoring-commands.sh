#!/bin/bash
# Monitoring Commands for Wetarseel API

# Add these to your ~/.bashrc or ~/.zshrc for quick access:

# 🔍 Live logs (like tail -f)
alias wetarseel-logs='aws logs tail /ecs/wetarseel-dev-api --follow'

# 📊 Recent logs (last 10 minutes)
alias wetarseel-recent='aws logs tail /ecs/wetarseel-dev-api --since 10m'

# 🚨 Error logs only
alias wetarseel-errors='aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api --filter-pattern "ERROR" --start-time $(date -d "1 hour ago" +%s)000'

# 📈 WhatsApp consumer logs
alias wetarseel-whatsapp='aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api --filter-pattern "WhatsApp" --start-time $(date -d "1 hour ago" +%s)000'

# 🏥 Health check
alias wetarseel-health='curl -s https://api.uae.wetarseel.ai/health && echo " ✅" || echo " ❌"'

# 📋 Service status
alias wetarseel-status='aws ecs describe-services --cluster wetarseel-dev --services wetarseel-dev-api --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount,TaskDefinition:taskDefinition}"'

# 🔄 Running tasks
alias wetarseel-tasks='aws ecs list-tasks --cluster wetarseel-dev --service-name wetarseel-dev-api'

# 🚀 Force restart
alias wetarseel-restart='aws ecs update-service --cluster wetarseel-dev --service wetarseel-dev-api --force-new-deployment'

# 📊 WhatsApp consumer status
alias wetarseel-whatsapp-status='curl -s https://api.uae.wetarseel.ai/api/whatsapp/status | jq'

# 🔍 Search logs for specific term
wetarseel-search() {
    if [ -z "$1" ]; then
        echo "Usage: wetarseel-search <search-term>"
        return 1
    fi
    aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api --filter-pattern "$1" --start-time $(date -d "1 hour ago" +%s)000
}

# 📈 Get logs from specific time range
wetarseel-logs-range() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo "Usage: wetarseel-logs-range <start-time> <end-time>"
        echo "Example: wetarseel-logs-range '2024-01-01 10:00' '2024-01-01 11:00'"
        return 1
    fi
    start_time=$(date -d "$1" +%s)000
    end_time=$(date -d "$2" +%s)000
    aws logs filter-log-events --log-group-name /ecs/wetarseel-dev-api --start-time $start_time --end-time $end_time
}

echo "🎯 Wetarseel monitoring commands loaded!"
echo "Try: wetarseel-logs, wetarseel-health, wetarseel-status"
