import { App, Editor, FileManager, FileSystemAdapter, FrontMatterCache, MarkdownView, Modal, normalizePath, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { Project, TodoistApi } from "@doist/todoist-api-typescript"// Remember to rename these classes and interfaces!
import { Console, error } from 'console';
import * as os from 'os';
interface TodoistProjectSyncSettings {
	PrimarySyncDevice: string;
	TodoistSyncFrequency: number;
	TodoistToken: string;
	TodoistProjectFolder: string;
}

const DEFAULT_SETTINGS: TodoistProjectSyncSettings = {
	TodoistToken: '',
	TodoistProjectFolder: 'Projects',
	TodoistSyncFrequency: 60,
	PrimarySyncDevice: ''
}

export default class TodoistProjectSync extends Plugin {
	settings: TodoistProjectSyncSettings;
	refreshIntervalID: number;
	todoistApi: TodoistApi;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new TodoistSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		this.setRefreshInterval();
	}

	setRefreshInterval() {
		if (this.refreshIntervalID > 0)
			window.clearInterval(this.refreshIntervalID);
		if (this.settings.TodoistSyncFrequency > 0)
			this.refreshIntervalID= this.registerInterval(window.setInterval(async () => {
				console.log(new Date().toLocaleString() + ': Updating Todoist Project files');
				await this.updateTodoistProjectFiles();
				console.log(new Date().toLocaleString() + ': Todoist Project files updated');
			}
				, this.settings.TodoistSyncFrequency * 1000));

	}
	async updateTodoistProjectFiles() {
		if (!(os.hostname() === this.settings.PrimarySyncDevice || this.settings.PrimarySyncDevice === '')) 			///	Object.entries(app.commands.commands).filter(([, val]) => val.name.includes("Reload app without saving")).forEach(([id]) => console.log(id))
		{
			console.log("Not Primary sync device - skipping Todoist sync");
			return;
		}
		//app:reload
		this.todoistApi = new TodoistApi(this.settings.TodoistToken);
		if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder))
			this.app.vault.createFolder(this.settings.TodoistProjectFolder);
		try {
			const projects = await this.todoistApi.getProjects();

			const files = this.app.vault.getMarkdownFiles();
			const filesById: { [id: string]: TFile; } = {};

			files.forEach(file => {
				const Metadata = this.app.metadataCache.getFileCache(file);
				if (Metadata?.frontmatter?.TodoistId)
					filesById[Metadata?.frontmatter?.TodoistId] = file;

			});
			const handledProjects: string[] = [];
			projects.forEach(async element => {
				handledProjects.push(element.id);
				let filepath = this.getPath(projects, element.id);
				if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder + filepath))
					await this.app.vault.createFolder(this.settings.TodoistProjectFolder + filepath);
				//If a project has sub-projects, the note should be placed in the project folder, otherwise, it should be placed in the parent project folder.
				if (projects.filter(p => p.parentId === element.id).length>0)
					filepath = filepath +"/"+ element.name;
				const filename = normalizePath(this.settings.TodoistProjectFolder + filepath + '/' + element.name + '.md');

				if (!this.app.vault.getAbstractFileByPath(filename)) {
					if (!filesById[element.id]) {
						await this.app.vault.create(filename, "---\nTodoistId: " + element.id + "\n---\n[" + element.name + "](https://todoist.com/app/project/" + element.id + ")"
							+ "\n```todoist \n\"name\": \"" + element.name + "\" \n\"filter\": \"#" + element.name + "\"\n```\n");
					}
					else {
						const oldPath = "/" + filesById[element.id].path.substring(0, filesById[element.id].path.length - (element.name + ".md").length - 1);
						if (!(await this.app.vault.adapter.exists("/" + filename)) && (await this.app.vault.adapter.exists("/" + filesById[element.id].path))) {

							await this.app.vault.rename(filesById[element.id], filename);
							if (this.app.vault.getAbstractFileByPath(normalizePath(oldPath)) instanceof TFolder) {
								let folderToDelete = this.app.vault.getAbstractFileByPath(normalizePath(oldPath)) as TFolder;
								let keepDeleting = true;
								if (folderToDelete.children.length == 0) {
									while (keepDeleting) {
										const nextfolderToDelete = folderToDelete?.parent;
										await this.app.fileManager.trashFile(folderToDelete!);
										folderToDelete = nextfolderToDelete!;
										if (folderToDelete.children.length > 0)
											keepDeleting = false;

									}

								}
							}
						}
					}
				}
			});
			const filesToRemove: TFile[] = [];

			files.forEach(file => {
				const Metadata = this.app.metadataCache.getFileCache(file);
				if (Metadata?.frontmatter?.TodoistId) {
					const todoistId: string = Metadata?.frontmatter?.TodoistId;
					if (!handledProjects.contains(todoistId.toString())) {
						filesToRemove.push(file);
					}
				}
			})
			filesToRemove.forEach(async file => {
				if (!await this.app.vault.adapter.exists(this.settings.TodoistProjectFolder + "/archive"))
					await this.app.vault.createFolder(this.settings.TodoistProjectFolder + "/archive");

				const Metadata = this.app.metadataCache.getFileCache(file);
				const projectNameFromMeta = Metadata?.frontmatter?.projectName;
				const todooistId = Metadata?.frontmatter?.TodoistId;
				if (!projectNameFromMeta)
					this.app.fileManager.processFrontMatter(file, fm => fm["projectName"] = file.name)
				// await this.addYamlProp("projectName", file.name, file);
				await this.app.vault.rename(file, this.settings.TodoistProjectFolder + "/archive/" + todooistId + ".md");

			});
		}
		catch (error) {
			console.log(error)
		};
	}
	getPath(projects: Project[], currentProjectId?: string): string {
		let result = "";
		if (currentProjectId) {
			const currentProject = projects.find(p => p.id === currentProjectId);
			if (currentProject?.parentId) {
				const parentProj = projects.find((proj: Project) => proj.id === currentProject?.parentId);
				if (parentProj)
					result = this.getPath(projects, parentProj.id) + "/" + parentProj.name;
				else
					throw new RangeError("Project tree structure in Todoist is malformed. Project with ID: " + currentProject.parentId + "Does not exist");
			}
		}
		return result;

	}
	// public async addYamlProp(propName: string, propValue: string, file: TFile): Promise<void> {
	// 	const fileContent: string = await this.app.vault.read(file);
	// 	const isYamlEmpty: boolean = (this.app.metadataCache.getFileCache(file)?.frontmatter === undefined && !fileContent.match(/^-{3}\s*\n*\r*-{3}/));


	// 	const splitContent = fileContent.split("\n");
	// 	if (isYamlEmpty) {
	// 		splitContent.unshift("---");
	// 		splitContent.unshift(`${propName}: ${propValue}`);
	// 		splitContent.unshift("---");
	// 	}
	// 	else {
	// 		splitContent.splice(1, 0, `${propName}: ${propValue}`);
	// 	}

	// 	const newFileContent = splitContent.join("\n");
	// 	await this.app.vault.modify(file, newFileContent);
	// }

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
			.setDesc('folder for projects')
			.addText(text => text
				.setPlaceholder('enter path')
				.setValue(this.plugin.settings.TodoistProjectFolder)
				.onChange(async (value) => {
					this.plugin.settings.TodoistProjectFolder = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Primary sync device')
			.setDesc('if this field is set, projects will only sync on the device with this name. This is to prevent sync-problems if projects are updated on multiple devices. The name of this device is"' + os.hostname() + '".')
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
					this.plugin.setRefreshInterval();

				}));

	}
}


