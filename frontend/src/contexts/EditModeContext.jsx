import { createContext, useContext } from 'react';

export const EditModeContext = createContext(false);

export const useEditMode = () => useContext(EditModeContext);
