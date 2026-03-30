import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionShell } from '../SectionShell';

const inputCls = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200';
const inputStyle = {
  borderColor: 'var(--sg-border)',
  color: 'var(--sg-navy)',
  background: '#fff',
  fontFamily: 'var(--sg-font)',
};
const focusStyle = (focused: boolean) => ({
  ...inputStyle,
  borderColor: focused ? 'var(--sg-thames)' : 'var(--sg-border)',
  boxShadow: focused ? '0 0 0 3px rgba(102,118,168,0.15)' : 'none',
});

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>
      {children}
    </label>
  );
}

export function SGFormControls() {
  const [focused, setFocused] = useState<string | null>(null);
  const [toggleOn, setToggleOn] = useState(false);
  const [checkbox, setCheckbox] = useState(false);
  const [radio, setRadio] = useState('option1');
  const [slider, setSlider] = useState(60);

  return (
    <SectionShell id="form-controls" title="Form Controls">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
        {/* Text Input */}
        <div>
          <Label>Text Input</Label>
          <input
            type="text"
            placeholder="e.g. Borough Market"
            className={inputCls}
            style={focusStyle(focused === 'text')}
            onFocus={() => setFocused('text')}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Select */}
        <div>
          <Label>Select</Label>
          <div className="relative">
            <select
              className={inputCls}
              style={{ ...focusStyle(focused === 'select'), appearance: 'none' }}
              onFocus={() => setFocused('select')}
              onBlur={() => setFocused(null)}
            >
              <option>Restaurant</option>
              <option>Café</option>
              <option>Bar</option>
              <option>Museum</option>
              <option>Park</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--sg-navy)', opacity: 0.4 }}>
              ▾
            </div>
          </div>
        </div>

        {/* Textarea */}
        <div className="md:col-span-2">
          <Label>Textarea</Label>
          <textarea
            rows={3}
            placeholder="Add your notes…"
            className={inputCls}
            style={focusStyle(focused === 'area')}
            onFocus={() => setFocused('area')}
            onBlur={() => setFocused(null)}
          />
        </div>

        {/* Checkbox */}
        <div>
          <Label>Checkbox</Label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checkbox}
              onChange={(e) => setCheckbox(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--sg-crimson)' }}
            />
            <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>
              Add to favourites
            </span>
          </label>
        </div>

        {/* Radio */}
        <div>
          <Label>Radio Group</Label>
          <div className="space-y-2">
            {[['option1', 'Visited'], ['option2', 'Want to visit'], ['option3', 'Not interested']].map(([val, label]) => (
              <label key={val} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="sg-radio"
                  value={val}
                  checked={radio === val}
                  onChange={() => setRadio(val)}
                  style={{ accentColor: 'var(--sg-crimson)' }}
                />
                <span className="text-sm" style={{ color: 'var(--sg-navy)', fontFamily: 'var(--sg-font)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Toggle */}
        <div>
          <Label>Toggle / Switch</Label>
          <button
            role="switch"
            aria-checked={toggleOn}
            onClick={() => setToggleOn(!toggleOn)}
            className="relative flex items-center w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9D3A3D]"
            style={{ background: toggleOn ? 'var(--sg-crimson)' : 'var(--sg-border)' }}
          >
            <motion.div
              layout
              className="absolute w-5 h-5 rounded-full bg-white shadow-md"
              animate={{ x: toggleOn ? 22 : 4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--sg-navy)', opacity: 0.5 }}>
            {toggleOn ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        {/* Slider */}
        <div>
          <Label>Slider — {slider}%</Label>
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(e) => setSlider(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: 'var(--sg-crimson)' }}
          />
        </div>
      </div>
    </SectionShell>
  );
}
