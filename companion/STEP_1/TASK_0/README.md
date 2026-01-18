# STEP_1/TASK_0: Git Repository Validity & Currency Check

## Goal
Confirm this directory is a valid git repository, on a known branch, and correctly configured.

## Objectives
- Confirm valid git repository status.
- Identify current branch and commit.
- Evaluate working tree state.
- Check upstream synchronization.
- Verify .companion/ is correctly ignored.

## Run Commands
`powershell
# 1) Must be inside a git repo
git rev-parse --is-inside-work-tree

# 2) Show current branch and commit
git branch --show-current
git rev-parse --short HEAD

# 3) Show working tree state
git status --porcelain

# 4) Check for upstream
git remote -v
git status -sb

# 5) Verify .companion is ignored
Select-String -Path .gitignore -Pattern '^\s*\.companion/\s*$' -List
git check-ignore -v .companion/USER.md
git check-ignore -v .companion/APPLICATION.md
`

## Verification Criteria
- git rev-parse --is-inside-work-tree returns 	rue.
- A branch name is printed (not detached HEAD).
- git status --porcelain is empty or shows expected changes.
- git status -sb shows no "behind" count.
- .companion/ is confirmed ignored.
