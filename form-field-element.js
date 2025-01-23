const sheet = new CSSStyleSheet();
sheet.replaceSync(`
	:host {
		--layout-inline-label-first: [label-start] auto [label-end control-start] auto [control-end];
		--layout-inline-control-first: [control-start] auto [control-end label-start] auto [label-end];
		--layout-stacked: [control-start label-start] auto [control-end label-end];

		display: grid;
		justify-content: start;
	}

	slot:is([name="label"], [name="control"])::slotted(*) {
		grid-row: 1;
	}

	slot[name="label"]::slotted(label) {
		grid-column: label-start / label-end;
	}

	slot[name="control"]::slotted(:is(input, textarea, select)) {
		grid-column: control-start / control-end;
	}
`);

const docSheet = new CSSStyleSheet();
docSheet.replaceSync(`
	@layer {
		form-field:has(label ~ :is(input, textarea, select)) {
			grid-template-columns: var(--layout-inline-label-first);
		}
		form-field:has(:is(input, textarea, select) ~ label) {
			grid-template-columns: var(--layout-inline-control-first);
		}
	}
`);

document.adoptedStyleSheets = [docSheet];

const defaultTemplate = document.createElement("template");
defaultTemplate.innerHTML = `
	<slot name="label"></slot>
	<slot name="control"></slot>
	<slot name="error-message"></slot>
	<slot name="descriptions"></slot>
`;

class FormFieldElement extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: "open" });
		this.shadowRoot.append(defaultTemplate.content.cloneNode(true));
		this.shadowRoot.adoptedStyleSheets = [sheet];

		this.shadowRoot.addEventListener("slotchange", this);
	}

	handleEvent(event) {
		switch (event.type) {
			case "slotchange": {
				if (event.target.name !== "control") break;
				const [control] = event.target.assignedElements();

				const labelBefore = this.shadowRoot.children.control.matches("slot[name=label] ~ *");
				switch (control?.type) {
					case "text":
					case "textarea":
						if (!labelBefore) {
							this.shadowRoot.children.label.after(
								this.shadowRoot.children.control
							);
						}
						break;
					case "checkbox":
					case "radio":
						if (labelBefore) {
							this.shadowRoot.children.label.before(
								this.shadowRoot.children.control
							);
						}
						break;

				}
				break;
			}
		}
	}
}

if (new URL(import.meta.url).searchParams.has("define", "")) {
	customElements.define("form-field", FormFieldElement);
}
