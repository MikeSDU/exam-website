(function(root){
  function grade(percent){if(percent>=90)return '12';if(percent>=75)return '10';if(percent>=60)return '7';if(percent>=45)return '4';if(percent>=30)return '02';if(percent>0)return '00';return '−3';}
  function compare(actual,expected,ordered=false){
    if(actual.length!==expected.length)return false;
    const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>typeof v==='number'&&typeof b[i]==='number'?Math.abs(v-b[i])<=Math.max(1e-6,Math.abs(b[i])*1e-6):v===b[i]);
    if(ordered)return actual.every((r,i)=>equal(r,expected[i]));
    // Match rows as a multiset. Preserve duplicate rows and tolerate numerical rounding.
    const remaining=expected.slice();for(const r of actual){const i=remaining.findIndex(x=>equal(r,x));if(i<0)return false;remaining.splice(i,1);}return true;
  }
  function validateFeedback(data,questions){
    if(!data||!Array.isArray(data.questions)||data.questions.length!==questions.length)throw Error('Incomplete grading response. No grade was saved.');
    const ids=new Set();for(const q of questions){const r=data.questions.find(x=>x.id===q.id);if(!r||ids.has(r.id)||!Array.isArray(r.marks)||r.marks.length!==q.criteria.length)throw Error('Grading response did not match the marking guide.');ids.add(r.id);r.marks.forEach((m,i)=>{if(!Number.isInteger(m)||m<0||m>q.criteria[i].max)throw Error('Invalid criterion score.');});if(typeof r.feedback!=='string'||typeof r.nextStep!=='string')throw Error('Missing feedback.');}
    if(typeof data.summary!=='string')throw Error('Missing assessment summary.');return data;
  }
  function parseNumber(s){const x=s.trim();return /^[-+]?\d+(?:[.,]\d+)?$/.test(x)?Number(x.replace(',','.')):NaN;}
  const api={grade,compare,validateFeedback,parseNumber};if(typeof module!=='undefined')module.exports=api;root.ExamCore=api;
})(typeof self!=='undefined'?self:globalThis);
