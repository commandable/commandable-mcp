Set up a Google Cloud Service Account:

1. Open the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Google Calendar API** for your project
3. Go to **IAM & Admin → Service Accounts** and create a new service account
4. Under **Keys**, click **Add Key → Create new key → JSON** and download the file
5. Paste the full contents of the JSON file here

For Google Workspace users: Calendar access typically requires domain-wide delegation.
Configure it in the Google Admin console, then set `subject` to the calendar owner's email.
