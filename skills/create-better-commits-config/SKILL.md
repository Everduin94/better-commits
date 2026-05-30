# create-better-commits-config

Create a minimal `.better-commits.jsonc` by inspecting the repository before choosing values.

1. Scan source folders, package/workspace names, and existing module names to propose likely `commit_scope.options`.
2. Scan commit history (`git log --oneline`) to extract common commit `type` values and ticket naming patterns.
3. Detect whether ticket numbers are usually included in titles, and whether issue references use a prefixed `#`.
4. Detect whether commit bodies are commonly multi-line/sentence-based to decide `commit_body.split_by_period`.
5. Keep the config small and practical; include only options that are actually observed in the project.
