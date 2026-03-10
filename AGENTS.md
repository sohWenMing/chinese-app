# Opencode Agent Instructions

## Core Principles

1. **Always test implementations before declaring completion**
   - Run all relevant tests for each implemented feature
   - Verify functionality works as expected
   - Ensure code meets specifications before human review
   - Document test results in comments

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

**Project URL**: https://chinese-app-sigma.vercel.app (after deployment)

**Deployment Commands**:
```bash
# Deploy to production
vercel --prod

# Deploy to preview (staging)
vercel
```

**Setup Steps** (One-time):
1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`
3. Link project: `vercel link` (creates `.vercel/project.json`)

**Auto-Deployment**:
- Vercel automatically deploys when you push to the `main` branch
- Preview deployments are created for pull requests

**Important Notes**:
- Always test locally with `npm run dev` before deploying
- Run `npm run build` locally to verify the build works
- Check Vercel dashboard for deployment logs if issues occur
- Keep `vercel.json` in the root directory for build configuration