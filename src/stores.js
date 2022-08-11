import { writable } from 'svelte/store';



export const screenWidth = writable(1280);
export const screenHeight = writable(800);
export const diagnostics = writable(["hi","hello", "bye"]);
export const speed = writable(88);
export const overrideSensors = writable(false);
export const forward=writable(false);
export const reverse=writable(false);

//-----

export const currentSpeed = writable(0);
export const voltage = writable(0);
export const draw = writable(0);
export const distance = writable(0);