# Opencode Agent Instructions

## Core Principles

1. **Always test implementations before declaring completion**
   - Run all relevant tests for each implemented feature
   - Verify functionality works as expected
   - Ensure code meets specifications before human review
   - Document test results in comments
   - Store all test result screenshots in a test_results/screenshots folder

2. **Follow the roadmap and plan**
   - Reference `plans/ROADMAP.md` for project structure and phases
   - Implement one phase at a time
   - Maintain progress tracking

3. **Code Quality Standards**
   - Write clean, readable code
   - Follow existing patterns in the codebase
   - Use appropriate file organization
   - Include meaningful comments

4. **User-Centric Development**
   - Focus on user experience for 8-year-olds
   - Implement playful, colorful UI
   - Ensure responsive design for iPad
   - Prioritize intuitive interactions

## Implementation Workflow

1. **Phase Planning**
   - Read relevant section from `plans/ROADMAP.md`
   - Understand requirements and deliverables
   - Break down into implementation steps

2. **Implementation**
   - Create necessary files and folders
   - Implement core functionality
   - Add appropriate styling
   - Include necessary tests

3. **Testing**
   - Run unit tests for new components
   - Test functionality manually
   - Verify on iPad simulator
   - Document test results

4. **Review Preparation**
   - Ensure all requirements met
   - Verify code quality
   - Prepare for human review

5. **Update Roadmap**
   - **CRITICAL**: After completing a phase, update `plans/ROADMAP.md`
   - Mark completed checklist items with `[x]` instead of `[ ]`
   - Add completion date/timestamp in a comment if helpful
   - This ensures future agents know what's already done
   - Example: Change `- [ ] 1.1: Create React project` to `- [x] 1.1: Create React project`

## File Structure Guidelines

- Use `plans/ROADMAP.md` as the authoritative source
- Maintain consistent component structure
- Separate CSS files for each component
- Organize files by feature areas

## Deployment Guidelines

### GitHub Repository

- **Repository URL**: https://github.com/sohWenMing/chinese-app
- Branch: `main`
- All code changes should be committed and pushed to this repository

### Vercel Deployment

**Live URL**: https://chinese-9kpf4ek2l-wenmingsoh-9763s-projects.vercel.app

**Easy Deployment (Skill)**:
Just say **"deploy"** - the skill will handle everything automatically.

**Setup (One-time)**:

1. Get token from: https://vercel.com/account/tokens
2. Create `.env` file: `cp .env.example .env`
3. Add token: `VERCEL_TOKEN=your_token_here`

**Auto-Deployment**:

- Vercel auto-deploys when you push to `main` branch
- Manual `vercel --prod` only needed for immediate deployment

**Important Notes**:

- Never commit `.env` file (it's in .gitignore)
- Always test locally with `npm run dev` before deploying
- Run `npm run build` locally to verify the build works
- Check Vercel dashboard for deployment logs if issues occur
- Keep `vercel.json` in the root directory for build configuration

