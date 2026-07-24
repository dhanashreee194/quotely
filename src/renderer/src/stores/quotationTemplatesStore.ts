import { create } from 'zustand'

type EditorTab = 'sections' | 'columns' | 'preview'

type QuotationTemplatesUiState = {
  selectedTemplateId: number | null
  selectedSectionId: number | null
  editorTab: EditorTab
  templateDialogOpen: boolean
  editingTemplateId: number | null
  sectionDialogOpen: boolean
  editingSectionId: number | null
  fieldDialogOpen: boolean
  editingFieldId: number | null
  columnDialogOpen: boolean
  editingColumnId: number | null
  selectTemplate: (id: number | null) => void
  selectSection: (id: number | null) => void
  setEditorTab: (tab: EditorTab) => void
  openTemplateCreate: () => void
  openTemplateEdit: (id: number) => void
  closeTemplateDialog: () => void
  openSectionCreate: () => void
  openSectionEdit: (id: number) => void
  closeSectionDialog: () => void
  openFieldCreate: () => void
  openFieldEdit: (id: number) => void
  closeFieldDialog: () => void
  openColumnCreate: () => void
  openColumnEdit: (id: number) => void
  closeColumnDialog: () => void
}

export const useQuotationTemplatesStore = create<QuotationTemplatesUiState>((set) => ({
  selectedTemplateId: null,
  selectedSectionId: null,
  editorTab: 'sections',
  templateDialogOpen: false,
  editingTemplateId: null,
  sectionDialogOpen: false,
  editingSectionId: null,
  fieldDialogOpen: false,
  editingFieldId: null,
  columnDialogOpen: false,
  editingColumnId: null,
  selectTemplate: (id) => set({ selectedTemplateId: id, selectedSectionId: null }),
  selectSection: (id) => set({ selectedSectionId: id }),
  setEditorTab: (tab) => set({ editorTab: tab }),
  openTemplateCreate: () => set({ templateDialogOpen: true, editingTemplateId: null }),
  openTemplateEdit: (id) => set({ templateDialogOpen: true, editingTemplateId: id }),
  closeTemplateDialog: () => set({ templateDialogOpen: false, editingTemplateId: null }),
  openSectionCreate: () => set({ sectionDialogOpen: true, editingSectionId: null }),
  openSectionEdit: (id) => set({ sectionDialogOpen: true, editingSectionId: id }),
  closeSectionDialog: () => set({ sectionDialogOpen: false, editingSectionId: null }),
  openFieldCreate: () => set({ fieldDialogOpen: true, editingFieldId: null }),
  openFieldEdit: (id) => set({ fieldDialogOpen: true, editingFieldId: id }),
  closeFieldDialog: () => set({ fieldDialogOpen: false, editingFieldId: null }),
  openColumnCreate: () => set({ columnDialogOpen: true, editingColumnId: null }),
  openColumnEdit: (id) => set({ columnDialogOpen: true, editingColumnId: id }),
  closeColumnDialog: () => set({ columnDialogOpen: false, editingColumnId: null })
}))
