# Skill: deploy-vercel

## When to Use

Use this skill when you want to deploy the Chinese Writing App to Vercel for testing on iPad or sharing via URL.

**Trigger phrases:**
- "deploy"
- "deploy to vercel"
- "deploy app"
- "push to production"

## Workflow

This skill automates the complete Vercel deployment workflow:

1. **Check Vercel CLI** - Installs if not present
2. **Check login status** - Prompts for login if not authenticated
3. **Check project link** - Links project to Vercel if not already done
4. **Deploy** - Runs `vercel --prod` and returns the live URL

## Prerequisites

- Git repository must be initialized
- GitHub remote must be configured
- `vercel.json` must exist in project root

## Usage

Simply say: **"deploy"** or **"deploy to vercel"**

The skill will handle everything and return the deployment URL when complete.

## What Gets Executed

```bash
# 1. Check/install Vercel CLI
npm install -g vercel

# 2. Check/login to Vercel
vercel login

# 3. Link project (one-time)
vercel link

# 4. Deploy to production
vercel --prod
```

## Output

After successful deployment, the skill returns:
- Production URL (e.g., `https://chinese-app-sigma.vercel.app`)
- Confirmation that deployment is complete

## Notes

- First deployment requires manual login via browser
- Subsequent deployments happen automatically on `git push` to main branch
- Manual `vercel --prod` only needed for immediate deployment
