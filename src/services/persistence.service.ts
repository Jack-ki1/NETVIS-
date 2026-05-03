import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { SavedModel } from '../types';

const STORAGE_KEY = 'netvis_saved_models';

export const persistenceService = {
  async saveModel(model: Omit<SavedModel, 'id' | 'timestamp'>, user: User | null) {
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
      const { error } = await supabase
        .from('models')
        .insert([{ 
          user_id: user.id, 
          config: newModel 
        }]);
      if (error) throw error;
    }

    return newModel;
  },

  async loadModels(user: User | null): Promise<SavedModel[]> {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (user) {
      const { data, error } = await supabase
        .from('models')
        .select('config')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      if (data) {
        const dbModels = data.map((d: any) => d.config);
        const all = [...dbModels, ...local];
        const unique = Array.from(new Map(all.map(m => [m.id, m])).values());
        return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }
    
    return local;
  },

  async deleteModel(id: string, user: User | null) {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(local.filter((m: any) => m.id !== id)));

    if (user) {
      const { error } = await supabase.from('models').delete().match({ 'config->id': id });
      if (error) throw error;
    }
  }
};
