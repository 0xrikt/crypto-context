import {expect,it,vi} from 'vitest';
import {createNotesEditor} from '../src/lib/notes-editor';
it('failed save retains an unsaved retryable draft',async()=>{
 const persist=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
 const editor=createNotesEditor('old',persist);
 editor.edit('new');expect(await editor.save()).toBe(false);
 expect(editor.getSnapshot()).toMatchObject({content:'new',saved:'old',saving:false});
 expect(editor.getSnapshot().error).not.toBeNull();
 expect(await editor.save()).toBe(true);expect(editor.getSnapshot().saved).toBe('new');editor.dispose();
});
it('edits during an outstanding write are saved in order',async()=>{
 let release!:()=>void;
 const persist=vi.fn().mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;})).mockResolvedValue(undefined);
 const editor=createNotesEditor('',persist);editor.edit('first');const saving=editor.save();
 editor.edit('latest');const joined=editor.save();expect(persist).toHaveBeenCalledTimes(1);
 release();await Promise.all([saving,joined]);
 expect(persist.mock.calls.map(call=>call[0])).toEqual(['first','latest']);
 expect(editor.getSnapshot()).toMatchObject({content:'latest',saved:'latest',saving:false});editor.dispose();
});
it('a late initial load does not overwrite a local draft',()=>{
 const editor=createNotesEditor('old',vi.fn());editor.edit('draft');editor.load('server');
 expect(editor.getSnapshot().content).toBe('draft');editor.dispose();
});
