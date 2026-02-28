Set up a Google Cloud Service Account:

1. Open the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Docs API** and **Google Drive API** for your project
3. Go to **IAM & Admin → Service Accounts** and create a new service account
4. Under **Keys**, click **Add Key → Create new key → JSON** and download the file
5. Paste the full contents of the JSON file here
6. Share your target Google Docs documents with the service account's `client_email`

For Google Workspace users: if you need to access user documents, configure domain-wide delegation and set the `subject` field to the user's email.
