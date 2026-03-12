import React, { useState } from 'react';

interface BiasType {
  key: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  tagColor: string;
  shortDesc: string;
  fullDesc: string;
  example: {
    biased: string;
    neutral: string;
    explanation: string;
  };
  signals: string[];
}

const BIAS_TYPES: BiasType[] = [
  {
    key: 'political_framing',
    name: 'Political Framing',
    icon: 'fa-balance-scale',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    tagColor: 'bg-blue-100 text-blue-700',
    shortDesc: 'Word choices that favor one political side',
    fullDesc:
      'Political framing bias occurs when a journalist selects language that subtly favors one political perspective over another — without stating anything factually false. The same event can be described in ways that prime very different reader reactions depending on which words are chosen.',
    example: {
      biased: '"Radical protesters stormed the Capitol building, threatening democracy."',
      neutral: '"Demonstrators entered the Capitol building during the certification vote."',
      explanation:
        '"Radical" is a loaded descriptor, "stormed" implies violence, and "threatening democracy" is an editorial judgment — none of which are neutral descriptions of the same event.',
    },
    signals: [
      '"Tax relief" instead of "tax cuts"',
      '"Illegal aliens" instead of "undocumented immigrants"',
      '"Pro-life" / "anti-abortion" labeling',
      '"Job creators" vs "the wealthy"',
      '"Government spending" vs "public investment"',
    ],
  },
  {
    key: 'political_direction',
    name: 'Political Direction',
    icon: 'fa-compass',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    tagColor: 'bg-purple-100 text-purple-700',
    shortDesc: 'Whether the bias leans left or right',
    fullDesc:
      'Once framing bias is detected, political direction identifies which side of the spectrum it favors. This is measured on a scale from Far Left to Far Right. An article can have strong framing bias without a clear direction (e.g. sensationalism), but most political framing has a detectable lean.',
    example: {
      biased: '"The radical left\'s open borders agenda would flood the country with illegal aliens."',
      neutral: '"The proposed immigration policy would increase the number of migrants admitted annually."',
      explanation:
        '"Radical left", "open borders agenda", and "illegal aliens" are all right-leaning framing choices that signal a strong rightward direction score.',
    },
    signals: [
      'Left signals: "undocumented", "reproductive rights", "gun safety", "climate crisis"',
      'Right signals: "illegal aliens", "pro-life", "tax relief", "radical left"',
      'Center: balanced sourcing, neutral descriptors, both sides represented',
    ],
  },
  {
    key: 'sensationalism',
    name: 'Sensationalism',
    icon: 'fa-fire',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    tagColor: 'bg-orange-100 text-orange-700',
    shortDesc: 'Exaggerated language designed to provoke emotion',
    fullDesc:
      'Sensationalism occurs when journalists use dramatic, exaggerated, or emotionally charged language to attract attention and provoke reactions — rather than to inform. It prioritizes engagement over accuracy and often makes minor events sound catastrophic or routine events sound extraordinary.',
    example: {
      biased: '"BOMBSHELL: Explosive new revelations could DEVASTATE the president in shocking scandal."',
      neutral: '"New documents revealed in the ongoing investigation may be relevant to the case."',
      explanation:
        '"BOMBSHELL", "explosive", "DEVASTATE", and "shocking" are all emotional amplifiers that add drama without adding factual content. The all-caps is a further sensationalism signal.',
    },
    signals: [
      '"Bombshell", "explosive", "shocking", "devastating"',
      '"Crisis" for routine problems',
      'Vague alarming claims: "could be catastrophic"',
      'Clickbait headlines that overstate the article',
      'Emotional language prioritized over facts',
    ],
  },
];

const BiasInfoPanel: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const active = BIAS_TYPES.find(b => b.key === selected) ?? null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-6 bg-slate-900 text-white shrink-0">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <i className="fas fa-info-circle text-blue-400"></i>
          Bias Types Being Analysed
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Click any bias type to learn what VeriBias is looking for
        </p>
      </div>

      {/* Bias cards */}
      <div className="p-4 flex flex-col gap-3 shrink-0">
        {BIAS_TYPES.map(bias => (
          <button
            key={bias.key}
            onClick={() => setSelected(selected === bias.key ? null : bias.key)}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200
              ${selected === bias.key
                ? `${bias.bgColor} ${bias.borderColor} shadow-sm`
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                  ${selected === bias.key ? bias.tagColor : 'bg-white border border-gray-200'}`}>
                  <i className={`fas ${bias.icon} text-sm
                    ${selected === bias.key ? '' : 'text-gray-500'}`} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{bias.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{bias.shortDesc}</div>
                </div>
              </div>
              <i className={`fas fa-chevron-down text-xs transition-transform duration-200 text-gray-400
                ${selected === bias.key ? 'rotate-180' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Expanded detail panel */}
      {active && (
        <div className={`mx-4 mb-4 rounded-xl border p-5 ${active.bgColor} ${active.borderColor} flex-1 overflow-y-auto`}>

          {/* Full description */}
          <p className={`text-sm leading-relaxed ${active.color} mb-5`}>
            {active.fullDesc}
          </p>

          {/* Example */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Example
            </div>

            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
                  Biased
                </div>
                <p className="text-sm text-red-900 italic">{active.example.biased}</p>
              </div>

              <div className="flex justify-center">
                <i className="fas fa-arrow-down text-gray-400 text-xs" />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">
                  Neutral alternative
                </div>
                <p className="text-sm text-green-900 italic">{active.example.neutral}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              {active.example.explanation}
            </p>
          </div>

          {/* Signals */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              What to look for
            </div>
            <ul className="space-y-1.5">
              {active.signals.map((signal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                  <i className="fas fa-circle text-[5px] mt-1.5 shrink-0 text-gray-400" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state when nothing selected */}
      {!active && (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <i className="fas fa-hand-pointer text-3xl text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">
              Select a bias type above to see its definition, an example, and what signals VeriBias detects
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiasInfoPanel;