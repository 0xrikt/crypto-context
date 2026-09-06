export interface NotesState { content:string; saved:string; saving:boolean; error:string|null }
/** Session-only draft survives page navigation. Writes are serialized and acknowledged. */
export function createNotesEditor(initial:string, persist:(content:string)=>Promise<void>, delay=1500) {
  let state: NotesState = {content:initial,saved:initial,saving:false,error:null};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<boolean> | null = null;
  const listeners = new Set<()=>void>();
  const update = (patch:Partial<NotesState>) => {state={...state,...patch};listeners.forEach(fn=>fn());};
  const save = ():Promise<boolean> => {
    clearTimeout(timer);
    if (running) return running;
    if (state.content === state.saved) return Promise.resolve(true);
    update({saving:true,error:null});
    running = (async () => {
      try {
        while (state.content !== state.saved) {
          const sent = state.content;
          await persist(sent);
          update({saved:sent});
        }
        return true;
      } catch {
        update({error:'Could not save notes. Your draft is kept here; retry before closing this page.'});
        return false;
      } finally {
        running=null;
        update({saving:false});
      }
    })();
    return running;
  };
  return {
    getSnapshot:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
    load:(content:string)=>{if(state.content===state.saved && !state.saving) update({content,saved:content});},
    edit:(content:string)=>{
      update({content,error:null});clearTimeout(timer);
      timer=setTimeout(()=>{void save();},delay);
    },
    save,
    dispose:()=>{clearTimeout(timer);},
  };
}
