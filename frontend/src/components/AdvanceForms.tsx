export default function AdvanceForms() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-4">Advance Select</h1>

      <div className="max-w-sm">
        <select
          data-select='{
          "placeholder": "Select option...",
          "toggleTag": "<button type=\"button\" aria-expanded=\"false\"></button>",
          "toggleClasses": "advance-select-toggle select-disabled:pointer-events-none select-disabled:opacity-40",
          "dropdownClasses": "advance-select-menu",
          "optionClasses": "advance-select-option selected:select-active",
          "optionTemplate": "<div className=\"flex justify-between items-center w-full\"><span data-title></span><span className=\"icon-[tabler--check] shrink-0 size-4 text-primary hidden selected:block \"></span></div>",
          "extraMarkup": "<span className=\"icon-[tabler--caret-up-down] shrink-0 size-4 text-base-content absolute top-1/2 end-3 -translate-y-1/2 \"></span>"
          }'
          className="hidden"
        >
          <option value="">Choose</option>
          <option value="name">Full Name</option>
          <option value="email">Email Address</option>
          <option value="description">Project Description</option>
          <option value="user_id">User Identification Number</option>
        </select>
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Toggle Count</h1>

      <div className="card w-40">
        <div className="text-base-content card-body font-semibold">
          <p
            data-toggle-count='{
              "target": "#toggle-duration-usage",
              "min": 10,
              "max": 100,
              "duration":100
            }'
            className="mb-2 text-center text-5xl">
            10
          </p>
          <input id="toggle-duration-usage" name="toggle-count-method" type="checkbox" className="switch switch-primary mx-auto" aria-label="toggle count" />
        </div>
      </div>

      <h1 className="text-xl font-medium mb-4 mt-6">Strong Password</h1>

      <div className="max-w-sm">
        <div className="flex mb-2">
          <div className="flex-1">
            <input type="password" id="password-hints" className="input" placeholder="Enter password" />
            <div
              data-strong-password='{
                "target": "#password-hints",
                "hints": "#password-hints-content",
                "stripClasses": "strong-password:bg-primary strong-password-accepted:bg-teal-500 h-1.5 flex-auto bg-neutral/20"
              }'
              className="rounded-full overflow-hidden mt-2 flex gap-0.5">
            </div>
          </div>
        </div>
        <div id="password-hints-content" className="mb-3">
          <div>
            <span className="text-sm text-base-content">Level:</span>
            <span
              data-pw-strength-hint='["Empty", "Weak", "Medium", "Strong", "Very Strong", "Super Strong"]'
              className="text-base-content text-sm font-semibold">
            </span>
          </div>
          <h6 className="my-2 text-base font-semibold text-base-content">Your password must contain:</h6>
          <ul className="text-base-content/80 space-y-1 text-sm">
            <li data-pw-strength-rule="min-length" className="strong-password-active:text-success flex items-center gap-x-2">
              <span className="icon-[tabler--circle-check] hidden size-5 shrink-0" data-check></span>
              <span className="icon-[tabler--circle-x] hidden size-5 shrink-0" data-uncheck></span>
              Minimum number of characters is 6.
            </li>
            <li data-pw-strength-rule="lowercase" className="strong-password-active:text-success flex items-center gap-x-2">
              <span className="icon-[tabler--circle-check] hidden size-5 shrink-0" data-check></span>
              <span className="icon-[tabler--circle-x] hidden size-5 shrink-0" data-uncheck></span>
              Should contain lowercase.
            </li>
            <li data-pw-strength-rule="uppercase" className="strong-password-active:text-success flex items-center gap-x-2">
              <span className="icon-[tabler--circle-check] hidden size-5 shrink-0" data-check></span>
              <span className="icon-[tabler--circle-x] hidden size-5 shrink-0" data-uncheck></span>
              Should contain uppercase.
            </li>
            <li data-pw-strength-rule="numbers" className="strong-password-active:text-success flex items-center gap-x-2">
              <span className="icon-[tabler--circle-check] hidden size-5 shrink-0" data-check></span>
              <span className="icon-[tabler--circle-x] hidden size-5 shrink-0" data-uncheck></span>
              Should contain numbers.
            </li>
            <li data-pw-strength-rule="special-characters" className="strong-password-active:text-success flex items-center gap-x-2" >
              <span className="icon-[tabler--circle-check] hidden size-5 shrink-0" data-check></span>
              <span className="icon-[tabler--circle-x] hidden size-5 shrink-0" data-uncheck></span>
              Should contain special characters.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
