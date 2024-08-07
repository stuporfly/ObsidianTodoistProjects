# Obsidian Todoist project sync

This plugin pulls project inforation from Todoist, and creates a note for each project, in a tree structure.

- when a project is delete in Todoist, the corrosponding note is archived.
- if a project is restored, the corrosponding note is restored from the archive.
- if a project is moved or renamed, the corrosponding note and sub-notes are moved and renamed. 


You have the following settings to work with: 
 - TodoistToken: The API-token from todoist that is required to access their api for your account.
 - PrimarySyncDevice: if this field is set, projects will only sync on the device with this name. This is to prevent sync-problems if projects are updated on multiple devices.
 - TodoistSyncFrequency: The interval, in seconds, between each sync.
 - TodoistProjectFolder: Defines which folder the todoist notes should be created in. 
    
    
By default, the newly created notes contains a link to the project in Todoist, and the code to show todos for the current project, assuming you have the Todoist Plugin installed.;


It is recommended that you also install the Folder Note plugin - if you don't you will have both folders and notes for any project that has sub-projects.
