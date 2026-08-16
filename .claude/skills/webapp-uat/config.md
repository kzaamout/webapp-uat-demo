# webapp-uat config

project-name: Team Documents (demo)
project-dir: /Users/kzaamout/Desktop/code/webapp-uat-demo

bug-fix-mechanism: direct

# spec-dir intentionally unset — specs/ doesn't exist yet in this repo (see
# README.md's "What's deliberately not here yet"). Spec-derived generation and
# the UI-conformance check will correctly no-op until it does.

review-before-fix: on

# backend-stores left to Phase 0.5 discovery — this app's own /api/health and
# docker-compose.yml give it everything it needs to find Postgres on its own.
