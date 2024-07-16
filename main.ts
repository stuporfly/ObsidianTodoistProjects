import { App, Editor, MarkdownView, Modal, normalizePath, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';
import { Project, TodoistApi } from "@doist/todoist-api-typescript"// Remember to rename these classes and interfaces!
const os = require('os');
// var defaultTemplate="[{{projectName}}](https://todoist.com/app/project/{{projectId}})\n```todoist \n\"name\": \"{{projectName}}\"\n \"filter\": \"#{{projectName}}\"\n```\n";

interface TodoistProjectSyncSettings {
	PrimarySyncDevice: string;
	TodoistSyncFrequency: number;
	TodoistToken: string;
	TodoistProjectFolder: string;
	// TodoistPageTemplate:string;
}

const DEFAULT_SETTINGS: TodoistProjectSyncSettings = {
	TodoistToken: 'default',
	TodoistProjectFolder: 'Projects',
	// TodoistPageTemplate:defaultTemplate,
	TodoistSyncFrequency:60,
	PrimarySyncDevice:''
}

export default class TodoistProjectSync extends Plugin {
	settings: TodoistProjectSyncSettings;
	
	async onload() {
		await this.loadSettings();
		
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





