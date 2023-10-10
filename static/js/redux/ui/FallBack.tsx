import React from "react";

const FallBack = () => {
  const msg = "Oooops, something went wrong!";
  return (
    <div className="fallback-container">
      <h2>{msg}</h2>
      <img src="/static/img/sob.png" alt={msg} />
      <p>We&apos;re sorry, but something went wrong. Please try refreshing the page.</p>
    </div>
  );
};

export default FallBack;
