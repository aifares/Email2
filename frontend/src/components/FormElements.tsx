export default function FormElements() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-4">Input</h1>

      <div className="w-96">
        <label className="label-text" htmlFor="labelAndHelperText">Full Name</label>
        <input type="text" placeholder="John Doe" className="input" id="labelAndHelperText" />
        <span className="helper-text">Please write your full name</span>
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Radio</h1>

      <div className="flex items-center gap-1">
        <input type="radio" name="radio-0" className="radio radio-primary" id="defaultRadio1" />
        <label className="label-text text-base" htmlFor="defaultRadio1"> Default </label>
      </div>
      <div className="flex items-center gap-1">
        <input type="radio" name="radio-0" className="radio radio-primary" id="defaultRadio2" defaultChecked />
        <label className="label-text text-base" htmlFor="defaultRadio2"> Checked </label>
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Checkbox</h1>

      <div className="flex items-center gap-1">
        <input type="checkbox" className="checkbox checkbox-primary" id="defaultCheckbox1" />
        <label className="label-text text-base" htmlFor="defaultCheckbox1">Default</label>
      </div>
      <div className="flex items-center gap-1">
        <input type="checkbox" className="checkbox checkbox-primary" id="defaultCheckbox2" defaultChecked />
        <label className="label-text text-base" htmlFor="defaultCheckbox2">Checked</label>
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Switch</h1>

      <div className="flex items-center gap-1">
        <input type="checkbox" className="switch switch-primary" id="switchType1" />
        <label className="label-text text-base" htmlFor="switchType1"> Default </label>
      </div>
      <div className="flex items-center gap-1">
        <input type="checkbox" className="switch switch-primary" id="switchType2" defaultChecked />
        <label className="label-text text-base" htmlFor="switchType2"> Checked </label>
      </div>
    </div>
  );
}
