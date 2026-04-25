# Releasing

Signed `vX.Y.Z` tags are the release authority, npm is the distribution target. Pushing one publishes the npm package from that exact commit. GitHub Releases are informational and may be edited by hand after the tag exists.

## Steps

1. Choose version `X.Y.Z`.

2. Update `CHANGELOG.md` and set the publishable package version to `X.Y.Z` without creating a tag.

3. Commit the release changes to `main`:

   ```bash
   git commit -m "chore(release): prepare for vX.Y.Z"
   ```

4. Create a signed tag on that commit and push the branch plus reachable tags:

   ```bash
   git tag -s vX.Y.Z -m "Release vX.Y.Z"
   git push --follow-tags
   ```

5. GitHub Actions publishes the tarball to npm and creates a draft GitHub Release for that tag unless one already exists.
