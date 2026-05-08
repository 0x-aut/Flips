import { Dexie } from 'dexie';

export const db = new Dexie("Flips_local_database");

// I dont need to save machine_id here just the blobs and metadata where necessary, i will iron out details later 
