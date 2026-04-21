import { supabase } from './supabase';

export interface SavedModel {
  id: string;
  name: string;
  modelKey: string;
  framework: string;
  hyperparams: any;
  epoch: number;
  accuracy: number;
  loss: number;
  timestamp: string;
  weights?: any; // Mocked for demonstration but could be bit-packed floats
}

const STORAGE_KEY = 'netvis_saved_models';

export const persistenceService = {
  async saveModel(model: Omit<SavedModel, 'id' | 'timestamp'>, user: any) {
    const newModel: SavedModel = {
      ...model,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
    };

    // Save to LocalStorage
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newModel, ...local]));

    // Try to save to Supabase if authenticated
    if (user) {
      try {
        const { error } = await supabase
          .from('models')
          .insert([{ 
            user_id: user.id, 
            config: newModel 
          }]);
        if (error) console.error('Supabase save error:', error);
      } catch (err) {
        console.error('Persistence error:', err);
      }
    }

    return newModel;
  },

  async loadModels(user: any): Promise<SavedModel[]> {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (user) {
      try {
        const { data, error } = await supabase
          .from('models')
          .select('config')
          .eq('user_id', user.id);
        
        if (!error && data) {
          const dbModels = data.map((d: any) => d.config);
          // Merge and unique by ID
          const all = [...dbModels, ...local];
          const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
          return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (err) {
        console.error('Load error:', err);
      }
    }
    
    return local;
  },

  async deleteModel(id: string, user: any) {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local.filter((m: any) => m.id !== id)));

    if (user) {
      try {
        await supabase.from('models').delete().match({ 'config->id': id });
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  }
};
