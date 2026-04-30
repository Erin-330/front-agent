Commit, push, and open a pull request to develop (테스트 생략).

Usage: /shipr [optional commit message]

Steps:

1. Check the current branch with `git branch --show-current`.
   - If the current branch is `develop`:
     - Determine an appropriate branch name based on the staged/unstaged changes (e.g. `feat/기능명`, `fix/버그명`, `chore/작업명` in kebab-case). If the user provided a message after `/shipr`, derive the branch name from that message.
     - Run `git checkout -b <branch-name>` to create and switch to the new branch before doing anything else.
2. Run `git add -A` to stage all changes
3. If the user provided a message after `/shipr`, use it as the commit message. Otherwise analyze `git diff --staged` and generate a concise commit message following this repo's style (Korean or English, e.g. `기능 추가`, `버그 수정`)
4. Commit: `git commit -m "<message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`
5. Push to the current branch: `git push -u origin <current-branch>`
6. If a PR already exists for the current branch, do NOT create a new one:
   - Find existing PR URL: `gh pr list --head <current-branch> --json url --jq '.[0].url'`
   - If the command returns a URL:
     - Update the PR description to reflect the latest changes on the branch:
       - Get PR number: `gh pr view <pr-url> --json number --jq '.number'`
       - Regenerate bullet points by analyzing the commit range from `develop` to `HEAD` (prefer `git log --oneline develop..HEAD` plus `git diff --stat develop..HEAD` if helpful), then produce a concise bullet list in Korean (OK).
       - Update body using this format:

         ```
         gh pr edit <pr-number> --body "$(cat <<'EOF'
         ## 변경사항
         <bullet points summarizing changes>

         🤖 Generated with [Claude Code](https://claude.com/claude-code)
         EOF
         )"
         ```

     - Return that PR URL to the user and STOP (skip PR creation).

7. Otherwise, create a PR to `develop` using `gh pr create --base develop`:
   - Title: same as the commit message
   - Body: summarize the changes in bullet points (Korean OK)
   - Use this format:

     ```
     gh pr create --title "<commit message>" --body "$(cat <<'EOF'
     ## 변경사항
     <bullet points summarizing changes>

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     EOF
     )"
     ```

8. Return the PR URL to the user.

Arguments: $ARGUMENTS

