const safeJsonParse = (str) => {
    let inString = false;
    let out      = '';
  
    for (let i = 0; i < str.length; i++) {
      const ch   = str[i];
      const prev = str[i - 1];
      const next = str[i + 1];
  
      if (ch === '"' && prev !== '\\') {
        if (!inString) {
          // début de valeur
          inString = true;
          out += ch;
        } else {
          // si ce " est suivi de : , } ] c'est bien la fin de la valeur
          if (next === ':' || next === ',' || next === '}' || next === ']') {
            inString = false;
            out += ch;
          } else {
            // sinon c'est un guillemet intérieur : on l'échappe
            out += '\\"';
          }
        }
      } else {
        out += ch;
      }
    }
  
    return JSON.parse(out);
  }
  
  /** ------------------ cmt 139886 ------------------
  // usage
  const raw = "{\"name\":\"Studio 3D procédural \"Virtual City Talks \"\", ... }";
  const data = safeJsonParse(raw);
  console.log(data.name);  // Studio 3D procédural "Virtual City Talks "
  *-------------------------------------------------*/

  const SafeJson = {
    parse: safeJsonParse,
  }
    export default SafeJson;
    export { safeJsonParse as parse };
  