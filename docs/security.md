# Existing credential exposure

Repository inspection found credential-like values in the pre-existing tracked `.env.example`. This change replaces them with empty placeholders. No historical value was used for network requests or copied into new source files.

Repository owners should revoke/rotate the previously committed OpenAI and Gemini credentials with their providers, inspect usage, and follow their organization's repository-history remediation process. Replacing the current file does not remove credentials from earlier commits. This implementation does not rewrite history or force-push.

New secrets belong only in ignored `.env` files or deployment secret storage. The browser receives provider presence and model configuration, never the key. Provider error payloads are not returned to clients. CSV exports neutralize spreadsheet formula prefixes and include review status and source.
