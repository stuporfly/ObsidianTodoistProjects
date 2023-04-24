# Obsidian Todoist project sync

This plugin pulls project inforation from Todoist, and creates a note for each project, in a tree structure.

- when a project is delete in Todoist, the corrosponding note is archived.
- if a project is restored, the corrosponding note is restored from the archive.
- if a project is moved or renamed, the corrosponding note and sub-notes are moved and renamed. 


under settings, you can define which folder the todoist notes should be created in, and  you can define a template for how newly created notes should look. By default, the newly created notes contains a link to the project in Todoist, and the code to show todos for the current project, assuming you have the Todoist Plugin installed.

It is recommended that you also install the Folder Note plugin - if you don't you will have both folders and notes for any project that has sub-projects.