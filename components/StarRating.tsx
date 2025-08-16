'use client';
import React from 'react';

type Props = {
  value: number;
  onChange: (n:number)=>void;
};

export default function StarRating({ value, onChange }: Props){
  return (
    <div className="star-rating">
      {[1,2,3,4,5].map(n=> (
        <button
          key={n}
          type="button"
          className={n <= value ? 'on' : ''}
          onClick={()=>onChange(n)}
          aria-label={`${n} star${n>1?'s':''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
