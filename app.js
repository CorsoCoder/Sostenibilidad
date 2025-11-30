/**
 * ============================================
 * GENERADOR VISUAL DE FORMULARIOS
 * Lógica principal de la aplicación
 * ============================================
 */

(function() {
    'use strict';

    // ============================================
    // Estado de la aplicación
    // ============================================
    const state = {
        fields: [],
        formSettings: {
            id: 'my-form',
            action: '#',
            method: 'POST'
        },
        currentEditingField: null,
        draggedItem: null
    };

    // ============================================
    // Configuración de tipos de campos
    // ============================================
    const fieldTypes = {
        text: { label: 'Texto', icon: '📝', hasPlaceholder: true, hasPattern: true, hasMaxLength: true },
        email: { label: 'Email', icon: '✉️', hasPlaceholder: true, hasPattern: true },
        password: { label: 'Password', icon: '🔒', hasPlaceholder: true, hasMaxLength: true },
        number: { label: 'Número', icon: '🔢', hasMin: true, hasMax: true, hasStep: true },
        date: { label: 'Fecha', icon: '📅', hasMin: true, hasMax: true },
        textarea: { label: 'Textarea', icon: '📄', hasPlaceholder: true, hasMaxLength: true, hasRows: true },
        checkbox: { label: 'Checkbox', icon: '☑️' },
        radio: { label: 'Radio', icon: '🔘', hasOptions: true },
        select: { label: 'Select', icon: '📋', hasOptions: true },
        file: { label: 'Archivo', icon: '📁', hasAccept: true, hasMultiple: true },
        submit: { label: 'Submit', icon: '🚀', isButton: true },
        reset: { label: 'Reset', icon: '🔄', isButton: true },
        fieldset: { label: 'Fieldset', icon: '📦', isContainer: true }
    };

    // ============================================
    // Generador de IDs únicos
    // ============================================
    function generateId() {
        return 'field_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    // ============================================
    // Crear un nuevo campo
    // ============================================
    function createField(type, parentId = null) {
        const typeConfig = fieldTypes[type];
        const id = generateId();
        
        const field = {
            id: id,
            type: type,
            name: type + '_' + Date.now().toString(36),
            label: typeConfig.label,
            placeholder: '',
            defaultValue: '',
            required: false,
            disabled: false,
            parentId: parentId
        };

        // Añadir propiedades específicas según el tipo
        if (typeConfig.hasPattern) field.pattern = '';
        if (typeConfig.hasMaxLength) field.maxLength = '';
        if (typeConfig.hasMin) field.min = '';
        if (typeConfig.hasMax) field.max = '';
        if (typeConfig.hasStep) field.step = '';
        if (typeConfig.hasRows) field.rows = 4;
        if (typeConfig.hasAccept) field.accept = '';
        if (typeConfig.hasMultiple) field.multiple = false;
        if (typeConfig.hasOptions) {
            field.options = [
                { value: 'option1', label: 'Opción 1' },
                { value: 'option2', label: 'Opción 2' },
                { value: 'option3', label: 'Opción 3' }
            ];
        }
        if (typeConfig.isContainer) {
            field.legend = 'Grupo de campos';
            field.children = [];
        }
        if (typeConfig.isButton) {
            field.buttonText = type === 'submit' ? 'Enviar' : 'Limpiar';
        }

        // Clases CSS personalizadas
        field.customClasses = '';
        field.customStyles = '';

        return field;
    }

    // ============================================
    // Añadir campo al estado
    // ============================================
    function addField(type, parentId = null) {
        const field = createField(type, parentId);
        
        if (parentId) {
            // Buscar el fieldset padre y añadir el campo como hijo
            const parent = findFieldById(parentId);
            if (parent && parent.children) {
                parent.children.push(field);
            }
        } else {
            state.fields.push(field);
        }
        
        renderFieldsList();
        renderPreview();
        generateCode();
        showToast('Campo añadido correctamente', 'success');
    }

    // ============================================
    // Buscar campo por ID
    // ============================================
    function findFieldById(id, fields = state.fields) {
        for (const field of fields) {
            if (field.id === id) return field;
            if (field.children) {
                const found = findFieldById(id, field.children);
                if (found) return found;
            }
        }
        return null;
    }

    // ============================================
    // Eliminar campo
    // ============================================
    function deleteField(id) {
        function removeFromArray(arr) {
            const index = arr.findIndex(f => f.id === id);
            if (index !== -1) {
                arr.splice(index, 1);
                return true;
            }
            for (const field of arr) {
                if (field.children && removeFromArray(field.children)) {
                    return true;
                }
            }
            return false;
        }
        
        removeFromArray(state.fields);
        renderFieldsList();
        renderPreview();
        generateCode();
        showToast('Campo eliminado', 'success');
    }

    // ============================================
    // Duplicar campo
    // ============================================
    function duplicateField(id) {
        const original = findFieldById(id);
        if (!original) return;

        const duplicate = JSON.parse(JSON.stringify(original));
        duplicate.id = generateId();
        duplicate.name = original.name + '_copy';
        
        // Actualizar IDs de hijos si es fieldset
        if (duplicate.children) {
            duplicate.children = duplicate.children.map(child => ({
                ...child,
                id: generateId(),
                name: child.name + '_copy',
                parentId: duplicate.id
            }));
        }

        // Encontrar la posición del original e insertar después
        function insertAfter(arr) {
            const index = arr.findIndex(f => f.id === id);
            if (index !== -1) {
                arr.splice(index + 1, 0, duplicate);
                return true;
            }
            for (const field of arr) {
                if (field.children && insertAfter(field.children)) {
                    return true;
                }
            }
            return false;
        }

        insertAfter(state.fields);
        renderFieldsList();
        renderPreview();
        generateCode();
        showToast('Campo duplicado', 'success');
    }

    // ============================================
    // Mover campo arriba/abajo
    // ============================================
    function moveField(id, direction) {
        function move(arr) {
            const index = arr.findIndex(f => f.id === id);
            if (index !== -1) {
                const newIndex = direction === 'up' ? index - 1 : index + 1;
                if (newIndex >= 0 && newIndex < arr.length) {
                    [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
                    return true;
                }
            }
            for (const field of arr) {
                if (field.children && move(field.children)) {
                    return true;
                }
            }
            return false;
        }

        move(state.fields);
        renderFieldsList();
        renderPreview();
        generateCode();
    }

    // ============================================
    // Renderizar lista de campos
    // ============================================
    function renderFieldsList() {
        const container = document.getElementById('fields-list');
        
        if (state.fields.length === 0) {
            container.innerHTML = '<p class="empty-message">No hay campos. Añade uno usando los botones de arriba.</p>';
            return;
        }

        container.innerHTML = renderFieldItems(state.fields);
        setupDragAndDrop();
    }

    function renderFieldItems(fields, level = 0) {
        return fields.map(field => {
            const typeConfig = fieldTypes[field.type];
            const isFieldset = field.type === 'fieldset';
            
            let html = `
                <div class="field-item ${isFieldset ? 'fieldset-item' : ''}" 
                     data-id="${field.id}" 
                     draggable="true"
                     style="margin-left: ${level * 16}px">
                    <div class="field-item-header">
                        <span class="drag-handle" title="Arrastrar para reordenar">⋮⋮</span>
                        <span class="field-type-badge">${typeConfig.icon} ${typeConfig.label}</span>
                        <span class="field-name">${escapeHtml(field.label || field.name)}</span>
                        <div class="field-item-actions">
                            <button type="button" class="btn-icon" onclick="window.formBuilder.moveField('${field.id}', 'up')" title="Mover arriba">↑</button>
                            <button type="button" class="btn-icon" onclick="window.formBuilder.moveField('${field.id}', 'down')" title="Mover abajo">↓</button>
                            <button type="button" class="btn-icon" onclick="window.formBuilder.editField('${field.id}')" title="Editar">✏️</button>
                            <button type="button" class="btn-icon" onclick="window.formBuilder.duplicateField('${field.id}')" title="Duplicar">📋</button>
                            <button type="button" class="btn-icon btn-danger" onclick="window.formBuilder.deleteField('${field.id}')" title="Eliminar">🗑️</button>
                        </div>
                    </div>
            `;

            if (isFieldset && field.children) {
                html += `
                    <div class="fieldset-children">
                        <div class="fieldset-add-btn">
                            <button type="button" class="btn btn-add btn-sm" onclick="window.formBuilder.showAddFieldMenu('${field.id}')" title="Añadir campo al grupo">
                                ➕ Añadir campo al grupo
                            </button>
                        </div>
                        ${field.children.length > 0 ? renderFieldItems(field.children, level + 1) : '<p class="empty-message" style="margin-left: 0">Grupo vacío</p>'}
                    </div>
                `;
            }

            html += '</div>';
            return html;
        }).join('');
    }

    // ============================================
    // Drag and Drop
    // ============================================
    function setupDragAndDrop() {
        const items = document.querySelectorAll('.field-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
        });
    }

    function handleDragStart(e) {
        state.draggedItem = e.target.closest('.field-item');
        state.draggedItem.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', state.draggedItem.dataset.id);
    }

    function handleDragEnd() {
        if (state.draggedItem) {
            state.draggedItem.classList.remove('dragging');
            state.draggedItem = null;
        }
        document.querySelectorAll('.field-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDragEnter(e) {
        e.preventDefault();
        const target = e.target.closest('.field-item');
        if (target && target !== state.draggedItem) {
            target.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const target = e.target.closest('.field-item');
        if (target) {
            target.classList.remove('drag-over');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        const target = e.target.closest('.field-item');
        if (!target || !state.draggedItem || target === state.draggedItem) return;

        const draggedId = state.draggedItem.dataset.id;
        const targetId = target.dataset.id;

        reorderFields(draggedId, targetId);
    }

    function reorderFields(draggedId, targetId) {
        // Encontrar y remover el campo arrastrado
        let draggedField = null;
        
        function removeField(arr) {
            const index = arr.findIndex(f => f.id === draggedId);
            if (index !== -1) {
                draggedField = arr.splice(index, 1)[0];
                return true;
            }
            for (const field of arr) {
                if (field.children && removeField(field.children)) {
                    return true;
                }
            }
            return false;
        }

        function insertBefore(arr) {
            const index = arr.findIndex(f => f.id === targetId);
            if (index !== -1) {
                arr.splice(index, 0, draggedField);
                return true;
            }
            for (const field of arr) {
                if (field.children && insertBefore(field.children)) {
                    return true;
                }
            }
            return false;
        }

        removeField(state.fields);
        if (draggedField) {
            insertBefore(state.fields);
            renderFieldsList();
            renderPreview();
            generateCode();
        }
    }

    // ============================================
    // Editar campo (modal)
    // ============================================
    function editField(id) {
        const field = findFieldById(id);
        if (!field) return;

        state.currentEditingField = field;
        const modal = document.getElementById('field-editor-modal');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        title.textContent = `Editar ${fieldTypes[field.type].label}`;
        body.innerHTML = generateFieldEditorForm(field);

        modal.classList.add('active');
        setupOptionsEditor();
    }

    function generateFieldEditorForm(field) {
        const typeConfig = fieldTypes[field.type];
        let html = '';

        // Campos comunes
        if (!typeConfig.isButton) {
            html += `
                <div class="form-group">
                    <label for="edit-name">Name (atributo):</label>
                    <input type="text" id="edit-name" value="${escapeHtml(field.name)}" required>
                </div>
                <div class="form-group">
                    <label for="edit-label">Label (etiqueta visible):</label>
                    <input type="text" id="edit-label" value="${escapeHtml(field.label)}">
                </div>
            `;
        }

        // Placeholder
        if (typeConfig.hasPlaceholder) {
            html += `
                <div class="form-group">
                    <label for="edit-placeholder">Placeholder:</label>
                    <input type="text" id="edit-placeholder" value="${escapeHtml(field.placeholder || '')}">
                </div>
            `;
        }

        // Valor por defecto
        if (!typeConfig.isButton && !typeConfig.isContainer && !typeConfig.hasOptions) {
            html += `
                <div class="form-group">
                    <label for="edit-default">Valor por defecto:</label>
                    <input type="text" id="edit-default" value="${escapeHtml(field.defaultValue || '')}">
                </div>
            `;
        }

        // Pattern
        if (typeConfig.hasPattern) {
            html += `
                <div class="form-group">
                    <label for="edit-pattern">Pattern (regex):</label>
                    <input type="text" id="edit-pattern" value="${escapeHtml(field.pattern || '')}" placeholder="[A-Za-z]+">
                </div>
            `;
        }

        // MaxLength
        if (typeConfig.hasMaxLength) {
            html += `
                <div class="form-group">
                    <label for="edit-maxlength">Longitud máxima:</label>
                    <input type="number" id="edit-maxlength" value="${field.maxLength || ''}" min="0">
                </div>
            `;
        }

        // Min/Max para números y fechas
        if (typeConfig.hasMin) {
            const inputType = field.type === 'date' ? 'date' : 'number';
            html += `
                <div class="form-group">
                    <label for="edit-min">Valor mínimo:</label>
                    <input type="${inputType}" id="edit-min" value="${field.min || ''}">
                </div>
            `;
        }

        if (typeConfig.hasMax) {
            const inputType = field.type === 'date' ? 'date' : 'number';
            html += `
                <div class="form-group">
                    <label for="edit-max">Valor máximo:</label>
                    <input type="${inputType}" id="edit-max" value="${field.max || ''}">
                </div>
            `;
        }

        // Step para números
        if (typeConfig.hasStep) {
            html += `
                <div class="form-group">
                    <label for="edit-step">Step (incremento):</label>
                    <input type="number" id="edit-step" value="${field.step || ''}" step="any" min="0">
                </div>
            `;
        }

        // Rows para textarea
        if (typeConfig.hasRows) {
            html += `
                <div class="form-group">
                    <label for="edit-rows">Filas (rows):</label>
                    <input type="number" id="edit-rows" value="${field.rows || 4}" min="1" max="20">
                </div>
            `;
        }

        // Accept para file
        if (typeConfig.hasAccept) {
            html += `
                <div class="form-group">
                    <label for="edit-accept">Tipos de archivo (accept):</label>
                    <input type="text" id="edit-accept" value="${escapeHtml(field.accept || '')}" placeholder=".jpg,.png,image/*">
                </div>
            `;
        }

        // Multiple para file
        if (typeConfig.hasMultiple) {
            html += `
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="edit-multiple" ${field.multiple ? 'checked' : ''}>
                    <label for="edit-multiple">Permitir múltiples archivos</label>
                </div>
            `;
        }

        // Options para radio y select
        if (typeConfig.hasOptions) {
            html += `
                <div class="form-group">
                    <label>Opciones:</label>
                    <div class="options-editor" id="options-editor">
                        ${(field.options || []).map((opt, i) => `
                            <div class="option-row" data-index="${i}">
                                <input type="text" class="option-value" value="${escapeHtml(opt.value)}" placeholder="Valor">
                                <input type="text" class="option-label" value="${escapeHtml(opt.label)}" placeholder="Etiqueta">
                                <button type="button" class="btn-icon btn-danger btn-remove-option" title="Eliminar opción">🗑️</button>
                            </div>
                        `).join('')}
                        <button type="button" class="btn btn-add btn-add-option">➕ Añadir opción</button>
                    </div>
                </div>
            `;
        }

        // Legend para fieldset
        if (typeConfig.isContainer) {
            html += `
                <div class="form-group">
                    <label for="edit-legend">Leyenda (legend):</label>
                    <input type="text" id="edit-legend" value="${escapeHtml(field.legend || '')}">
                </div>
            `;
        }

        // Button text
        if (typeConfig.isButton) {
            html += `
                <div class="form-group">
                    <label for="edit-buttontext">Texto del botón:</label>
                    <input type="text" id="edit-buttontext" value="${escapeHtml(field.buttonText || '')}">
                </div>
            `;
        }

        // Checkboxes comunes
        if (!typeConfig.isButton) {
            html += `
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="edit-required" ${field.required ? 'checked' : ''}>
                    <label for="edit-required">Campo requerido</label>
                </div>
            `;
        }

        html += `
            <div class="form-group checkbox-group">
                <input type="checkbox" id="edit-disabled" ${field.disabled ? 'checked' : ''}>
                <label for="edit-disabled">Deshabilitado</label>
            </div>
        `;

        // Clases CSS personalizadas
        html += `
            <div class="form-group">
                <label for="edit-classes">Clases CSS personalizadas:</label>
                <input type="text" id="edit-classes" value="${escapeHtml(field.customClasses || '')}" placeholder="class1 class2">
            </div>
            <div class="form-group">
                <label for="edit-styles">Estilos inline:</label>
                <input type="text" id="edit-styles" value="${escapeHtml(field.customStyles || '')}" placeholder="color: red; font-size: 16px;">
            </div>
        `;

        return html;
    }

    function setupOptionsEditor() {
        const editor = document.getElementById('options-editor');
        if (!editor) return;

        // Añadir opción
        editor.querySelector('.btn-add-option')?.addEventListener('click', () => {
            const rows = editor.querySelectorAll('.option-row');
            const newIndex = rows.length;
            const newRow = document.createElement('div');
            newRow.className = 'option-row';
            newRow.dataset.index = newIndex;
            newRow.innerHTML = `
                <input type="text" class="option-value" value="option${newIndex + 1}" placeholder="Valor">
                <input type="text" class="option-label" value="Opción ${newIndex + 1}" placeholder="Etiqueta">
                <button type="button" class="btn-icon btn-danger btn-remove-option" title="Eliminar opción">🗑️</button>
            `;
            editor.insertBefore(newRow, editor.querySelector('.btn-add-option'));
            
            // Añadir evento al nuevo botón de eliminar
            newRow.querySelector('.btn-remove-option').addEventListener('click', function() {
                newRow.remove();
            });
        });

        // Eliminar opción
        editor.querySelectorAll('.btn-remove-option').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.option-row').remove();
            });
        });
    }

    function saveFieldChanges() {
        const field = state.currentEditingField;
        if (!field) return;

        const typeConfig = fieldTypes[field.type];

        // Guardar valores comunes
        if (!typeConfig.isButton) {
            field.name = document.getElementById('edit-name')?.value || field.name;
            field.label = document.getElementById('edit-label')?.value || '';
        }

        // Guardar propiedades específicas
        if (typeConfig.hasPlaceholder) {
            field.placeholder = document.getElementById('edit-placeholder')?.value || '';
        }

        if (!typeConfig.isButton && !typeConfig.isContainer && !typeConfig.hasOptions) {
            field.defaultValue = document.getElementById('edit-default')?.value || '';
        }

        if (typeConfig.hasPattern) {
            field.pattern = document.getElementById('edit-pattern')?.value || '';
        }

        if (typeConfig.hasMaxLength) {
            field.maxLength = document.getElementById('edit-maxlength')?.value || '';
        }

        if (typeConfig.hasMin) {
            field.min = document.getElementById('edit-min')?.value || '';
        }

        if (typeConfig.hasMax) {
            field.max = document.getElementById('edit-max')?.value || '';
        }

        if (typeConfig.hasStep) {
            field.step = document.getElementById('edit-step')?.value || '';
        }

        if (typeConfig.hasRows) {
            field.rows = parseInt(document.getElementById('edit-rows')?.value) || 4;
        }

        if (typeConfig.hasAccept) {
            field.accept = document.getElementById('edit-accept')?.value || '';
        }

        if (typeConfig.hasMultiple) {
            field.multiple = document.getElementById('edit-multiple')?.checked || false;
        }

        if (typeConfig.hasOptions) {
            const optionRows = document.querySelectorAll('#options-editor .option-row');
            field.options = Array.from(optionRows).map(row => ({
                value: row.querySelector('.option-value')?.value || '',
                label: row.querySelector('.option-label')?.value || ''
            }));
        }

        if (typeConfig.isContainer) {
            field.legend = document.getElementById('edit-legend')?.value || '';
        }

        if (typeConfig.isButton) {
            field.buttonText = document.getElementById('edit-buttontext')?.value || '';
        }

        if (!typeConfig.isButton) {
            field.required = document.getElementById('edit-required')?.checked || false;
        }
        
        field.disabled = document.getElementById('edit-disabled')?.checked || false;
        field.customClasses = document.getElementById('edit-classes')?.value || '';
        field.customStyles = document.getElementById('edit-styles')?.value || '';

        closeModal();
        renderFieldsList();
        renderPreview();
        generateCode();
        showToast('Campo actualizado', 'success');
    }

    function closeModal() {
        const modal = document.getElementById('field-editor-modal');
        modal.classList.remove('active');
        state.currentEditingField = null;
    }

    // ============================================
    // Renderizar vista previa
    // ============================================
    function renderPreview() {
        const container = document.getElementById('form-preview');
        
        if (state.fields.length === 0) {
            container.innerHTML = '<p class="empty-message">La vista previa aparecerá aquí cuando añadas campos.</p>';
            return;
        }

        const formHtml = generateFormHtml(state.fields, true);
        container.innerHTML = `
            <form id="${escapeHtml(state.formSettings.id)}" action="${escapeHtml(state.formSettings.action)}" method="${state.formSettings.method}" onsubmit="event.preventDefault(); alert('Formulario enviado (vista previa)');">
                ${formHtml}
            </form>
        `;
    }

    function generateFormHtml(fields, isPreview = false) {
        return fields.map(field => {
            const typeConfig = fieldTypes[field.type];
            let html = '';

            const customClass = field.customClasses ? ` ${escapeHtml(field.customClasses)}` : '';
            const customStyle = field.customStyles ? ` style="${escapeHtml(field.customStyles)}"` : '';

            switch (field.type) {
                case 'text':
                case 'email':
                case 'password':
                case 'number':
                case 'date':
                    html = generateInputHtml(field, customClass, customStyle);
                    break;
                case 'textarea':
                    html = generateTextareaHtml(field, customClass, customStyle);
                    break;
                case 'checkbox':
                    html = generateCheckboxHtml(field, customClass, customStyle);
                    break;
                case 'radio':
                    html = generateRadioHtml(field, customClass, customStyle);
                    break;
                case 'select':
                    html = generateSelectHtml(field, customClass, customStyle);
                    break;
                case 'file':
                    html = generateFileHtml(field, customClass, customStyle);
                    break;
                case 'submit':
                case 'reset':
                    html = generateButtonHtml(field, customClass, customStyle);
                    break;
                case 'fieldset':
                    html = generateFieldsetHtml(field, isPreview);
                    break;
            }

            return html;
        }).join('\n');
    }

    function generateInputHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';
        const placeholderAttr = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
        const valueAttr = field.defaultValue ? ` value="${escapeHtml(field.defaultValue)}"` : '';
        const patternAttr = field.pattern ? ` pattern="${escapeHtml(field.pattern)}"` : '';
        const maxLengthAttr = field.maxLength ? ` maxlength="${escapeHtml(field.maxLength)}"` : '';
        const minAttr = field.min ? ` min="${escapeHtml(field.min)}"` : '';
        const maxAttr = field.max ? ` max="${escapeHtml(field.max)}"` : '';
        const stepAttr = field.step ? ` step="${escapeHtml(field.step)}"` : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        return `
    <div class="form-field${customClass}"${customStyle}>
        <label for="${escapeHtml(field.name)}">${escapeHtml(field.label)}${requiredIndicator}</label>
        <input type="${field.type}" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${placeholderAttr}${valueAttr}${patternAttr}${maxLengthAttr}${minAttr}${maxAttr}${stepAttr}${requiredAttr}${disabledAttr}>
    </div>`;
    }

    function generateTextareaHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';
        const placeholderAttr = field.placeholder ? ` placeholder="${escapeHtml(field.placeholder)}"` : '';
        const maxLengthAttr = field.maxLength ? ` maxlength="${escapeHtml(field.maxLength)}"` : '';
        const rowsAttr = field.rows ? ` rows="${field.rows}"` : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        return `
    <div class="form-field${customClass}"${customStyle}>
        <label for="${escapeHtml(field.name)}">${escapeHtml(field.label)}${requiredIndicator}</label>
        <textarea id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${placeholderAttr}${maxLengthAttr}${rowsAttr}${requiredAttr}${disabledAttr}>${escapeHtml(field.defaultValue || '')}</textarea>
    </div>`;
    }

    function generateCheckboxHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';
        const checkedAttr = field.defaultValue ? ' checked' : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        return `
    <div class="form-field checkbox-field${customClass}"${customStyle}>
        <input type="checkbox" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${checkedAttr}${requiredAttr}${disabledAttr}>
        <label for="${escapeHtml(field.name)}">${escapeHtml(field.label)}${requiredIndicator}</label>
    </div>`;
    }

    function generateRadioHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        const optionsHtml = (field.options || []).map((opt, i) => `
        <div class="radio-field">
            <input type="radio" id="${escapeHtml(field.name)}_${i}" name="${escapeHtml(field.name)}" value="${escapeHtml(opt.value)}"${requiredAttr}${disabledAttr}>
            <label for="${escapeHtml(field.name)}_${i}">${escapeHtml(opt.label)}</label>
        </div>`).join('');

        return `
    <div class="form-field${customClass}"${customStyle}>
        <label>${escapeHtml(field.label)}${requiredIndicator}</label>
        <div class="radio-group">
${optionsHtml}
        </div>
    </div>`;
    }

    function generateSelectHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        const optionsHtml = (field.options || []).map(opt => 
            `            <option value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</option>`
        ).join('\n');

        return `
    <div class="form-field${customClass}"${customStyle}>
        <label for="${escapeHtml(field.name)}">${escapeHtml(field.label)}${requiredIndicator}</label>
        <select id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${requiredAttr}${disabledAttr}>
${optionsHtml}
        </select>
    </div>`;
    }

    function generateFileHtml(field, customClass, customStyle) {
        const requiredAttr = field.required ? ' required' : '';
        const disabledAttr = field.disabled ? ' disabled' : '';
        const acceptAttr = field.accept ? ` accept="${escapeHtml(field.accept)}"` : '';
        const multipleAttr = field.multiple ? ' multiple' : '';

        const requiredIndicator = field.required ? '<span class="required-indicator">*</span>' : '';

        return `
    <div class="form-field${customClass}"${customStyle}>
        <label for="${escapeHtml(field.name)}">${escapeHtml(field.label)}${requiredIndicator}</label>
        <input type="file" id="${escapeHtml(field.name)}" name="${escapeHtml(field.name)}"${acceptAttr}${multipleAttr}${requiredAttr}${disabledAttr}>
    </div>`;
    }

    function generateButtonHtml(field, customClass, customStyle) {
        const disabledAttr = field.disabled ? ' disabled' : '';

        return `
    <div class="form-field${customClass}"${customStyle}>
        <button type="${field.type}"${disabledAttr}>${escapeHtml(field.buttonText || (field.type === 'submit' ? 'Enviar' : 'Limpiar'))}</button>
    </div>`;
    }

    function generateFieldsetHtml(field, isPreview) {
        const childrenHtml = field.children ? generateFormHtml(field.children, isPreview) : '';

        return `
    <fieldset${field.customClasses ? ` class="${escapeHtml(field.customClasses)}"` : ''}${field.customStyles ? ` style="${escapeHtml(field.customStyles)}"` : ''}>
        <legend>${escapeHtml(field.legend || 'Grupo')}</legend>
${childrenHtml}
    </fieldset>`;
    }

    // ============================================
    // Generar código
    // ============================================
    function generateCode() {
        generateHtmlCode();
        generateCssCode();
        generateJsCode();
    }

    function generateHtmlCode() {
        const codeElement = document.getElementById('code-html');
        
        if (state.fields.length === 0) {
            codeElement.textContent = '<!-- Añade campos para ver el código HTML -->';
            return;
        }

        const formHtml = generateFormHtml(state.fields, false);
        const code = `<form id="${escapeHtml(state.formSettings.id)}" action="${escapeHtml(state.formSettings.action)}" method="${state.formSettings.method}">
${formHtml}
</form>`;

        codeElement.textContent = code;
    }

    function generateCssCode() {
        const codeElement = document.getElementById('code-css');
        const customCss = document.getElementById('custom-css')?.value || '';

        const baseCss = `/* === Estilos base del formulario === */
#${escapeHtml(state.formSettings.id)} {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

#${escapeHtml(state.formSettings.id)} .form-field {
    margin-bottom: 16px;
}

#${escapeHtml(state.formSettings.id)} label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
    color: #333;
}

#${escapeHtml(state.formSettings.id)} input[type="text"],
#${escapeHtml(state.formSettings.id)} input[type="email"],
#${escapeHtml(state.formSettings.id)} input[type="password"],
#${escapeHtml(state.formSettings.id)} input[type="number"],
#${escapeHtml(state.formSettings.id)} input[type="date"],
#${escapeHtml(state.formSettings.id)} input[type="file"],
#${escapeHtml(state.formSettings.id)} select,
#${escapeHtml(state.formSettings.id)} textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

#${escapeHtml(state.formSettings.id)} input:focus,
#${escapeHtml(state.formSettings.id)} select:focus,
#${escapeHtml(state.formSettings.id)} textarea:focus {
    outline: none;
    border-color: #4a90d9;
    box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

#${escapeHtml(state.formSettings.id)} textarea {
    min-height: 100px;
    resize: vertical;
}

#${escapeHtml(state.formSettings.id)} .checkbox-field,
#${escapeHtml(state.formSettings.id)} .radio-field {
    display: flex;
    align-items: center;
    gap: 8px;
}

#${escapeHtml(state.formSettings.id)} .checkbox-field input,
#${escapeHtml(state.formSettings.id)} .radio-field input {
    width: auto;
}

#${escapeHtml(state.formSettings.id)} .radio-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

#${escapeHtml(state.formSettings.id)} fieldset {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
}

#${escapeHtml(state.formSettings.id)} legend {
    font-weight: 600;
    padding: 0 8px;
    color: #4a90d9;
}

#${escapeHtml(state.formSettings.id)} button[type="submit"],
#${escapeHtml(state.formSettings.id)} button[type="reset"] {
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}

#${escapeHtml(state.formSettings.id)} button[type="submit"] {
    background-color: #4a90d9;
    color: white;
}

#${escapeHtml(state.formSettings.id)} button[type="submit"]:hover {
    background-color: #357abd;
}

#${escapeHtml(state.formSettings.id)} button[type="reset"] {
    background-color: #6c757d;
    color: white;
    margin-left: 8px;
}

#${escapeHtml(state.formSettings.id)} button[type="reset"]:hover {
    background-color: #5a6268;
}

#${escapeHtml(state.formSettings.id)} .required-indicator {
    color: #dc3545;
    margin-left: 2px;
}

/* === Responsive === */
@media (max-width: 480px) {
    #${escapeHtml(state.formSettings.id)} {
        padding: 12px;
    }
    
    #${escapeHtml(state.formSettings.id)} button[type="submit"],
    #${escapeHtml(state.formSettings.id)} button[type="reset"] {
        width: 100%;
        margin-left: 0;
        margin-top: 8px;
    }
}`;

        const fullCss = customCss ? `${baseCss}\n\n/* === CSS Personalizado === */\n${customCss}` : baseCss;
        codeElement.textContent = fullCss;
    }

    function generateJsCode() {
        const codeElement = document.getElementById('code-js');
        const includeValidation = document.getElementById('include-validation')?.checked;

        if (!includeValidation) {
            codeElement.textContent = '// Validación JavaScript deshabilitada';
            return;
        }

        const requiredFields = getAllFields(state.fields).filter(f => f.required && !fieldTypes[f.type].isButton);

        if (requiredFields.length === 0) {
            codeElement.textContent = '// No hay campos con validación requerida';
            return;
        }

        const validationCode = `// === Validación del formulario ===
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('${escapeHtml(state.formSettings.id)}');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            let firstError = null;
            
            // Limpiar errores previos
            form.querySelectorAll('.error-message').forEach(el => el.remove());
            form.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
            
            // Validar campos requeridos
${requiredFields.map(f => `            // Validar ${escapeHtml(f.label || f.name)}
            const field_${f.name.replace(/[^a-zA-Z0-9]/g, '_')} = form.querySelector('[name="${escapeHtml(f.name)}"]');
            if (field_${f.name.replace(/[^a-zA-Z0-9]/g, '_')} && !field_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}.value.trim()) {
                showError(field_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}, 'Este campo es requerido');
                isValid = false;
                if (!firstError) firstError = field_${f.name.replace(/[^a-zA-Z0-9]/g, '_')};
            }`).join('\n\n')}
            
            if (!isValid) {
                e.preventDefault();
                if (firstError) firstError.focus();
            }
        });
    }
    
    function showError(field, message) {
        field.classList.add('field-error');
        const errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = 'color: #dc3545; font-size: 12px; display: block; margin-top: 4px;';
        field.parentNode.appendChild(errorEl);
    }
});`;

        codeElement.textContent = validationCode;
    }

    function getAllFields(fields) {
        let result = [];
        fields.forEach(field => {
            result.push(field);
            if (field.children) {
                result = result.concat(getAllFields(field.children));
            }
        });
        return result;
    }

    // ============================================
    // Copiar al portapapeles
    // ============================================
    async function copyToClipboard(type) {
        let text = '';
        
        switch (type) {
            case 'html':
                text = document.getElementById('code-html')?.textContent || '';
                break;
            case 'css':
                text = document.getElementById('code-css')?.textContent || '';
                break;
            case 'js':
                text = document.getElementById('code-js')?.textContent || '';
                break;
            case 'all':
                const html = document.getElementById('code-html')?.textContent || '';
                const css = document.getElementById('code-css')?.textContent || '';
                const js = document.getElementById('code-js')?.textContent || '';
                text = `<!-- HTML -->\n${html}\n\n<!-- CSS -->\n<style>\n${css}\n</style>\n\n<!-- JavaScript -->\n<script>\n${js}\n</script>`;
                break;
        }

        try {
            await navigator.clipboard.writeText(text);
            showToast('Código copiado al portapapeles', 'success');
        } catch (err) {
            // Fallback para navegadores que no soportan clipboard API
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('Código copiado al portapapeles', 'success');
            } catch (fallbackErr) {
                showToast('Error al copiar. Intenta seleccionar el código manualmente.', 'error');
            }
            document.body.removeChild(textarea);
        }
    }

    // ============================================
    // Exportar archivos
    // ============================================
    function exportFiles() {
        const html = document.getElementById('code-html')?.textContent || '';
        const css = document.getElementById('code-css')?.textContent || '';
        const js = document.getElementById('code-js')?.textContent || '';

        const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Formulario Generado</title>
    <link rel="stylesheet" href="form-styles.css">
</head>
<body>
    ${html}
    <script src="form-validation.js"></script>
</body>
</html>`;

        // Crear y descargar archivos
        downloadFile('formulario.html', fullHtml, 'text/html');
        setTimeout(() => downloadFile('form-styles.css', css, 'text/css'), 100);
        setTimeout(() => downloadFile('form-validation.js', js, 'application/javascript'), 200);

        showToast('Archivos descargados', 'success');
    }

    function downloadFile(filename, content, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ============================================
    // Guardar/Cargar configuración
    // ============================================
    function saveConfig() {
        const config = {
            version: '1.0',
            formSettings: state.formSettings,
            fields: state.fields,
            customCss: document.getElementById('custom-css')?.value || ''
        };

        const json = JSON.stringify(config, null, 2);
        downloadFile('formulario-config.json', json, 'application/json');
        showToast('Configuración guardada', 'success');
    }

    function loadConfig(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const config = JSON.parse(e.target.result);
                
                if (config.formSettings) {
                    state.formSettings = config.formSettings;
                    document.getElementById('form-id').value = config.formSettings.id || 'my-form';
                    document.getElementById('form-action').value = config.formSettings.action || '#';
                    document.getElementById('form-method').value = config.formSettings.method || 'POST';
                }
                
                if (config.fields) {
                    state.fields = config.fields;
                }
                
                if (config.customCss) {
                    const customCssElement = document.getElementById('custom-css');
                    if (customCssElement) {
                        customCssElement.value = config.customCss;
                    }
                }

                renderFieldsList();
                renderPreview();
                generateCode();
                showToast('Configuración cargada correctamente', 'success');
            } catch (err) {
                showToast('Error al cargar la configuración. Verifica que el archivo sea válido.', 'error');
            }
        };
        reader.readAsText(file);
    }

    // ============================================
    // Limpiar todo
    // ============================================
    function clearAll() {
        if (confirm('¿Estás seguro de que quieres eliminar todos los campos?')) {
            state.fields = [];
            renderFieldsList();
            renderPreview();
            generateCode();
            showToast('Formulario limpiado', 'success');
        }
    }

    // ============================================
    // Toast notifications
    // ============================================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ============================================
    // Utilidades
    // ============================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================
    // Menú de añadir campo para fieldsets
    // ============================================
    function showAddFieldMenu(parentId) {
        // Crear un menú desplegable simple
        const types = ['text', 'email', 'password', 'number', 'date', 'textarea', 'checkbox', 'radio', 'select', 'file'];
        const typeLabels = types.map(t => `${fieldTypes[t].icon} ${fieldTypes[t].label}`);
        
        const selected = prompt(`Selecciona el tipo de campo a añadir:\n${types.map((t, i) => `${i + 1}. ${typeLabels[i]}`).join('\n')}\n\nEscribe el número:`);
        
        if (selected) {
            const index = parseInt(selected) - 1;
            if (index >= 0 && index < types.length) {
                addField(types[index], parentId);
            }
        }
    }

    // ============================================
    // Inicialización
    // ============================================
    function init() {
        // Event listeners para añadir campos
        document.querySelectorAll('.btn-add[data-type]').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = this.dataset.type;
                addField(type);
            });
        });

        // Event listeners para tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Actualizar botones activos
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar panel correspondiente
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.getElementById('tab-' + tabId)?.classList.add('active');
            });
        });

        // Event listeners para ajustes del formulario
        document.getElementById('form-id')?.addEventListener('input', function() {
            state.formSettings.id = this.value || 'my-form';
            renderPreview();
            generateCode();
        });

        document.getElementById('form-action')?.addEventListener('input', function() {
            state.formSettings.action = this.value || '#';
            generateCode();
        });

        document.getElementById('form-method')?.addEventListener('change', function() {
            state.formSettings.method = this.value;
            generateCode();
        });

        // Event listeners para copiar código
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', function() {
                copyToClipboard(this.dataset.copy);
            });
        });

        document.getElementById('btn-copy-all')?.addEventListener('click', () => {
            copyToClipboard('all');
        });

        // Event listener para exportar
        document.getElementById('btn-export')?.addEventListener('click', exportFiles);

        // Event listeners para guardar/cargar configuración
        document.getElementById('btn-save-config')?.addEventListener('click', saveConfig);
        
        document.getElementById('btn-load-config')?.addEventListener('click', function() {
            document.getElementById('config-file-input')?.click();
        });

        document.getElementById('config-file-input')?.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                loadConfig(this.files[0]);
                this.value = ''; // Reset para poder cargar el mismo archivo de nuevo
            }
        });

        // Event listener para limpiar todo
        document.getElementById('btn-clear-all')?.addEventListener('click', clearAll);

        // Event listeners del modal
        document.getElementById('modal-close')?.addEventListener('click', closeModal);
        document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
        document.getElementById('modal-save')?.addEventListener('click', saveFieldChanges);

        // Cerrar modal al hacer clic fuera
        document.getElementById('field-editor-modal')?.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        // Event listener para CSS personalizado
        document.getElementById('custom-css')?.addEventListener('input', generateCssCode);

        // Event listener para validación JS
        document.getElementById('include-validation')?.addEventListener('change', generateJsCode);

        // Cerrar modal con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });

        // Renderizar estado inicial
        renderFieldsList();
        renderPreview();
        generateCode();
    }

    // Exponer funciones necesarias globalmente
    window.formBuilder = {
        addField,
        editField,
        deleteField,
        duplicateField,
        moveField,
        showAddFieldMenu
    };

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
