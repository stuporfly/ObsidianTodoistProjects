import { App, Editor, FileManager, FileSystemAdapter, FrontMatterCache, MarkdownView, Modal, normalizePath, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { Project, TodoistApi } from "@doist/todoist-api-typescript"// Remember to rename these classes and interfaces!
import { Console } from 'console';
const os = require('os')
interface TodoistProjectSyncSettings {
	PrimarySyncDevice: string;
	TodoistSyncFrequency: number;
	TodoistToken: string;
	TodoistProjectFolder: string;
}

const DEFAULT_SETTINGS: TodoistProjectSyncSettings = {
	TodoistToken: 'default',
	TodoistProjectFolder: 'Projects',
	TodoistSyncFrequency:60,
	PrimarySyncDevice:''
}

export default class TodoistProjectSync extends Plugin {
	settings: TodoistProjectSyncSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TodoistSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(async () => {
			console.log(new Date().toLocaleString()+': Updating Todoist Project files');
await this.updateTodoistProjectFiles();
console.log(new Date().toLocaleString()+': Todoist Project files updated');
}
			, this.settings.TodoistSyncFrequency * 1000));

	}
	async updateTodoistProjectFiles()
{
	if (os.hostname()===this.settings.PrimarySyncDevice ||this.settings.PrimarySyncDevice==='')
{			///	Object.entries(app.commands.commands).filter(([, val]) => val.name.includes("Reload app without saving")).forEach(([id]) => console.log(id))

//My result:

//app:reload
var folder=	 this.app.vault.getAbstractFileByPath(normalizePath("/TodoistProjects/Home improvement/build Wall"));
const api = new TodoistApi(this.settings.TodoistToken);
if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder))
this.app.vault.createFolder(this.settings.TodoistProjectFolder);
api.getProjects()
	.then((projects: Project[]) => {

		const files = this.app.vault.getFiles();
		const filesById: { [id: string] : TFile; } = {};
		
		files.forEach(file => {
			const Metadata = this.app.metadataCache.getFileCache(file);
if (Metadata?.frontmatter?.TodoistId)
									filesById[Metadata?.frontmatter?.TodoistId]=file;
			
		});
		const  handledProjects  :string[]= [];
		projects.forEach(async element => {
			handledProjects.push(element.id);
			const filepath = this.getPath(projects, element.id);
			if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder+filepath))
			await this.app.vault.createFolder(this.settings.TodoistProjectFolder+filepath);

			const filename = this.settings.TodoistProjectFolder +filepath+ '/' + element.name + '.md';

			if (files.filter(file => file.path == filename).length == 0 ) {
				if (!filesById[element.id])
				{
					await this.app.vault.create(filename, "---\nTodoistId: "+element.id+"\n---\n["+element.name+"](https://todoist.com/app/project/" + element.id + ")"
						+"\n```todoist \n\"name\": \""+element.name+"\" \n\"filter\": \"#" + element.name + "\"\n```\n");
					}
				else
				{
					const oldPath = "/"+filesById[element.id].path.substring(0,filesById[element.id].path.length-(element.name+".md").length-1);
					if (!(await this.app.vault.adapter.exists("/"+filename)) &&(await this.app.vault.adapter.exists("/"+filesById[element.id].path)))
{
	
					await this.app.vault.rename(filesById[element.id],filename);
					if ( this.app.vault.getAbstractFileByPath(normalizePath(oldPath)) instanceof TFolder)
						{					
							let folderToDelete=	 this.app.vault.getAbstractFileByPath(normalizePath(oldPath)) as TFolder  ;
		let keepDeleting=true;
					if (folderToDelete.children.length==0)
{								while (keepDeleting)
					{
						const nextfolderToDelete=	 folderToDelete?.parent;
							await this.app.fileManager.trashFile(folderToDelete!!);
							folderToDelete=nextfolderToDelete!!;
							if (folderToDelete.children.length>0)
								keepDeleting=false;
					}

				}
				}
			}
		}
			}
		});
		const filesToRemove:TFile[]=[];

			files.forEach(file=>{
				const Metadata = this.app.metadataCache.getFileCache(file);
				if (Metadata?.frontmatter?.TodoistId)
			{		
				const todoistId:string=Metadata?.frontmatter?.TodoistId;


				if (!handledProjects.contains( todoistId.toString()))
									{
										filesToRemove.push(file);
									}
								}
												})
											filesToRemove.forEach( async file=>{
												if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder+"/archive"))
												await this.app.vault.createFolder(this.settings.TodoistProjectFolder+"/archive");

												const Metadata = this.app.metadataCache.getFileCache(file);
												const projectNameFromMeta=Metadata?.frontmatter?.projectName;
												const todooistId=Metadata?.frontmatter?.TodoistId;
																					if (!projectNameFromMeta)
													await this.addYamlProp( "projectName",  file.name,  file);
												await this.app.vault.rename(file,this.settings.TodoistProjectFolder+"/archive/"+todooistId+".md");

											});

	})
	.catch((error) => console.log(error))
}
else
console.log("Not Primary sync device - skipping Todoist sync");
}
	getPath(projects: Project[], currentProjectId?: string): string {
		let result = "";
		if (currentProjectId) {
			const currentProject = projects.find(p => p.id === currentProjectId);
			if (currentProject?.parentId) {
				const parentProj = projects.find((proj: Project) => proj.id === currentProject?.parentId);
				result = this.getPath(projects, parentProj?.id) + "/"+parentProj?.name;
			}
		}
		return result;

	}
    public async addYamlProp(propName: string, propValue: string, file: TFile): Promise<void> {
        const fileContent: string = await this.app.vault.read(file);
		const isYamlEmpty: boolean = (this.app.metadataCache.getFileCache(file)?.frontmatter === undefined && !fileContent.match(/^-{3}\s*\n*\r*-{3}/));


		const splitContent = fileContent.split("\n");
        if (isYamlEmpty) {
            splitContent.unshift("---");
            splitContent.unshift(`${propName}: ${propValue}`);
            splitContent.unshift("---");
        }
        else {
            splitContent.splice(1, 0, `${propName}: ${propValue}`);
        }

        const newFileContent = splitContent.join("\n");
        await this.app.vault.modify(file, newFileContent);
    }

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class TodoistSettingTab extends PluginSettingTab {
	plugin: TodoistProjectSync;

	constructor(app: App, plugin: TodoistProjectSync) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings.' });

		new Setting(containerEl)
			.setName('Todoist API Key')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.TodoistToken)
				.onChange(async (value) => {
					this.plugin.settings.TodoistToken = value;
					await this.plugin.saveSettings();
				}));
				new Setting(containerEl)
				.setName('Todoist project Folder')
				.setDesc('folder for projects' )
				.addText(text => text
					.setPlaceholder('enter path')
					.setValue(this.plugin.settings.TodoistProjectFolder)
					.onChange(async (value) => {
						this.plugin.settings.TodoistProjectFolder = value;
						await this.plugin.saveSettings();
					}));
					new Setting(containerEl)
					.setName('Primary sync device')
					.setDesc('if this field is set, projects will only sync on the device with this name. This is to prevent sync-problems if projects are updated on multiple devices. The name of this device is"' + os.hostname()+'".')
					.addText(text => text
						.setPlaceholder('')
						.setValue(this.plugin.settings.PrimarySyncDevice)
						.onChange(async (value) => {
							this.plugin.settings.PrimarySyncDevice = value;
							await this.plugin.saveSettings();
						}));
						new Setting(containerEl)
			.setName('Todoist sync frequency in seconds')
			.setDesc('Sync frequency in seconds')
			.addText(Number => Number
				.setPlaceholder("0")
				.setValue(this.plugin.settings.TodoistSyncFrequency.toString())
				.onChange(async (value) => {
					this.plugin.settings.TodoistSyncFrequency = parseInt(value);
					await this.plugin.saveSettings();
				}));
	
	}
}


