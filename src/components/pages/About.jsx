import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/Mainlayouts'
import AboutImage from '../../assets/About.png'
import NuestraLogoImage from '../../assets/nuestralogo.jpg'
import { LuEye, LuSparkles } from "react-icons/lu";
import ExecutiveBoardCard from '../icons/ExecutiveBoardCard';
import { getSection } from '../../lib/content'

const FALLBACK_BOARD = [
  { name: "Engr. Felipe C. Urrutia", title: "School President" },
  { name: "Guia B. Urrutia", title: "Executive Vice President" },
  { name: "Philip James B. Urrutia", title: "V.P. for Building Administration & Infrastructure Development" },
  { name: "Engr. Patrick Gene B. Urrutia", title: "V.P. for External Affairs" },
  { name: "Phia Mae U. Grivas", title: "V.P. for Finance" },
  { name: "Engr. Paul Gian B. Urrutia", title: "V.P. for Academics" },
];

const About = () => {
  const [boardMembers, setBoardMembers] = useState(FALLBACK_BOARD);

  useEffect(() => {
    getSection('board').then((c) => {
      if (c.items?.length) setBoardMembers(c.items);
    });
  }, []);

  return (
    <MainLayout>
      {/* 1. HERO SECTION */}
      <div
        className="relative w-screen h-[450px] -ml-[50vw] left-1/2 right-1/2 -mr-[50vw] flex items-center"
        style={{
          backgroundImage: `url(${AboutImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#800000]/90 mix-blend-multiply" />
        <div className="relative z-10 w-full px-6 md:px-16 lg:px-24">
          <div className="max-w-4xl text-left text-white">
            <div className="mb-6 px-4 py-1 border border-white/30 bg-white/10 rounded-full w-fit">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">About Us</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
              Nuestra Señora De <br />
              Guia Academy of <br />
              Marikina
            </h1>
            <p className="text-white/80 text-sm font-medium italic tracking-wide">
                Guiding Young Minds Toward Excellence and Faith.
            </p>
          </div>
        </div>
      </div>

      {/* 2. VISION & MISSION SECTION */}
      <div className="bg-[#F8F9FA] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white rounded-md shadow-sm p-12 relative flex flex-col min-h-[320px]">
               <div className="absolute left-0 top-8 bottom-8 w-[4px] bg-[#800000]" />
               <div className="mb-6">
                  <LuEye className="text-[#800000]" size={32} />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Vision</h2>
               <p className="text-[13px] text-gray-500 leading-relaxed uppercase tracking-tight text-justify">
                  NUESTRA SEÑORA DE GUIA ACADEMY OF MARIKINA shall be the epitome of ACADEMIC EXCELLENCE by providing quality education relevant to the changing needs of the society.
               </p>
            </div>
            <div className="bg-white rounded-md shadow-sm p-12 relative flex flex-col min-h-[320px]">
               <div className="absolute left-0 top-8 bottom-8 w-[4px] bg-[#800000]" />
               <div className="mb-6">
                  <LuSparkles className="text-[#800000]" size={32} />
               </div>
               <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Mission</h2>
               <p className="text-[13px] text-gray-500 leading-relaxed text-justify">
                  NUESTRA SEÑORA DE GUIA ACADEMY OF MARIKINA shall provide quality education to prepare young children to harness their full intellectual capabilities that will aid them to effectively plot the paths they wish to trod later in life.
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SCHOOL SEAL BREAKDOWN SECTION */}
      <div className="bg-[#600000] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="space-y-16 text-white text-center lg:text-right order-2 lg:order-1">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Book of Knowledge</h4>
                <p className="text-[11px] leading-relaxed opacity-80 text-justify lg:text-right">
                  Represents the school's thrust in delivering quality education relevant to the changing times. The book is open to show the school's openness to changes and new things. The Vision and Mission Statements of the School are embedded in the pages to serve as a constant reminder to all students.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Twelve Stars</h4>
                <p className="text-[11px] leading-relaxed opacity-80 text-justify lg:text-right">
                  Represent the Marian inspiration in the founding of the school. Owing to the Directress' devotion to the Virgin at Ermita, she deemed it fit to initially name her school Nuestra Señora De Guia Learning Center.
                </p>
              </div>
            </div>
            <div className="flex justify-center order-1 lg:order-2">
                <img 
                  src={NuestraLogoImage} 
                  alt="School Seal" 
                  className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl rounded-full bg-white p-2" 
                />
            </div>
            <div className="space-y-16 text-white text-center lg:text-left order-3">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Roman Torch</h4>
                <p className="text-[11px] leading-relaxed opacity-80 text-justify lg:text-left">
                  Refers to the school's aspirations in blazing the trail in the field of education. The torch's flame is the light that leads us in the road ahead. The letters [FG] on the rim of the torch refer to the initials of the school's founding couple — Felipe and Guia.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Laurel Leaves</h4>
                <p className="text-[11px] leading-relaxed opacity-80 text-justify lg:text-left">
                  Symbolize the school's commitment to relevant and quality education. The five pairs of leaves symbolize the school's five-point objectives.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-20 text-center text-white max-w-4xl mx-auto border-t border-white/20 pt-10">
            <h4 className="text-sm font-bold uppercase tracking-widest mb-3">Green and Red</h4>
            <p className="text-[11px] leading-relaxed opacity-80">
              Are the school's official colors. Green symbolizes life and hope. Life is a continuous growth for human fullness and hope that God will put order to everything we do. The color red shows the passion for excellence that is imbued to each and every Deguian graduate. It also symbolizes the love that moves every Deguian to excel.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SCHOOL PHILOSOPHY SECTION */}
      <div className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-[#800000]/10 rounded-lg -z-10" />
              <div className="bg-[#FFF4E5] rounded-2xl p-8 shadow-xl">
                 <img 
                  src="https://img.freepik.com/free-vector/teacher-concept-illustration_114360-1638.jpg" 
                  alt="Philosophy Illustration" 
                  className="w-full h-auto rounded-lg"
                 />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-[#800000] mb-8">School Philosophy</h2>
              <div className="space-y-6 text-gray-600 text-[14px] leading-relaxed text-justify">
                <p>
                  Nuestra Señora De Guia Academy of Marikina is a non-sectarian Catholic-oriented school primarily centered to the child's total personality development with spiritual and ethical values in order to live up to the aspiration of our patron, NUESTRA SEÑORA DE GUIA. Inspired by the admonition of the Holy Bible: "To train up a child the way he should go? and when he is old, he will not depart from it." (Prov. 22:6), the school emphasizes on the need for growth and the holistic development of the child.
                </p>
                <p>
                  Nuestra Señora De Guia Academy of Marikina considers the child as the centerpiece of its foundation and organization. Thus, Nuestra Señora de Guia Academy of Marikina commits itself to provide the child with quality education in the service of humanity and God.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-[1px] w-12 bg-[#800000]" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#800000]">Excellence in every detail</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. OUR HISTORY & EXECUTIVE BOARD SECTION */}
      <div className="bg-[#F2F2F2] pt-24 pb-0">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our History</h2>
          <div className="max-w-5xl mx-auto space-y-8 text-gray-600 text-[14px] leading-loose text-center mb-24">
            <p>
              Putting up a school that will provide quality education at an affordable rate has been the lifelong dream of the indefatigable Mrs. Guia B. Urrutia, the School's Executive Vice President. With the full support of her husband, the generous Engr. Felipe C. Urrutia, and her children, Nuestra Señora De Guia Academy of Marikina was born. Being both educators, Sir Philip and Ma'am Ging, as both were affectionately called; they knew what they wanted for the school. As a devotee of the Virgin of Ermita Church, Nuestra Señora De Guia, Ma'am Ging deemed it fit to name her school the same.
            </p>
            <p>
              With an initial enrolment of FOURTEEN (14) pupils and a teacher, the school started operating for the S.Y. 1999-2000. From there the school never looked back. Enrolment has grown by leaps and bounds and each year, the school adds another level. As of the SY 2012-2013, in addition to offering complete pre-elementary and elementary levels, the school commenced offering the complete high school level.
            </p>
            <p>
              In response to the call of the government in the implementation of the K to 12 Program, Nuestra Señora De Guia Academy of Marikina successfully gained accreditation to participate in the Education Service Contracting (ESC) program institution and commenced its Senior High School (SHS) program at the start of the SY 2016-2017. This paved the way for the establishment of its first Annex Campus located at #98 Soliven Street, Marikina Greenheights Subdivision Phase 3, Nangka, Marikina City to accommodate the SHS population.
            </p>
            <p>
              Committed to the delivery of quality education at affordable rates, the school continues to improve the quality of instruction. Aside from the core competencies, the school has deemed it appropriate to include early computer education for all levels to prepare the students for the digital age. In addition, the school has also put up a speech laboratory to hone the students, specifically from Grade 6 to Junior High School levels in the mastery of the English language. On SY 2019 - 2020, Nuestra Señora De Guia Academy of Marikina opened its doors to the people of Angono and the nearby municipalities from Eastern Rizal.
            </p>
            <p className="font-medium italic text-gray-800">
              With faith and inspiration from the Blessed Virgin Mary, Nuestra Señora De Guia Academy of Marikina looks forward to serving the community and the country for years to come.
            </p>
          </div>
        </div>

        {/* EXECUTIVE BOARD SUB-SECTION - Extended to Footer */}
        <div className="bg-[#D1D1D1] py-24 -mx-6 md:-mx-16 lg:-mx-24 px-6 md:px-16 lg:px-24">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-12 text-center uppercase tracking-widest">Executive Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
              {boardMembers.map((member, index) => (
                <ExecutiveBoardCard key={index}>
                  <div className="w-32 h-32 flex-shrink-0 bg-white border border-gray-300 p-1">
                    <img
                      src={member.photo || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xl font-bold text-[#800000] leading-tight">{member.name}</h4>
                    <p className="text-[11px] font-semibold text-gray-500 mt-3 tracking-wider leading-tight uppercase max-w-[200px]">
                      {member.title}
                    </p>
                  </div>
                </ExecutiveBoardCard>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

export default About