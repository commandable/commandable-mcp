Set up a Google Cloud Service Account:

1. Open the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Gmail API** for your project
3. Go to **IAM & Admin -> Service Accounts** and create a new service account
4. Under **Keys**, click **Add Key -> Create new key -> JSON** and download the file
5. Paste the full contents of the JSON file here
6. For Google Workspace mailboxes, configure domain-wide delegation and set `subject` to the target user's email

For personal Gmail accounts, use the OAuth token variant instead.
