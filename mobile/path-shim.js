// path shim for browser/WebView
function _basename(p){
	if (typeof p !== 'string') return '';
	p = p.replace(/\\/g,'/');
	if (!p) return '';
	const parts = p.split('/');
	return parts[parts.length-1] || '';
}
function _normalize(p){
	if (typeof p !== 'string') return '';
	p = p.replace(/\\/g,'/');
	// remove ./ and resolve ../ minimally
	const segments = [];
	for (const seg of p.split('/')){
		if (!seg || seg === '.') continue;
		if (seg === '..') { if (segments.length) segments.pop(); continue; }
		segments.push(seg);
	}
	return segments.join('/');
}
function _join(){
	const parts = Array.prototype.slice.call(arguments).filter(x=>typeof x==='string' && x.length>0);
	return _normalize(parts.join('/'));
}
function _resolve(){
	// Simple resolve that just joins paths
	const parts = Array.prototype.slice.call(arguments).filter(x=>typeof x==='string' && x.length>0);
	if (parts.length === 0) return '/';
	let result = parts.join('/');
	// If first part doesn't start with /, make it absolute
	if (!result.startsWith('/')) result = '/' + result;
	return _normalize(result);
}
function _dirname(p){
	if (typeof p !== 'string') return '';
	p = p.replace(/\\/g,'/');
	const parts = p.split('/');
	parts.pop(); // Remove filename
	return parts.join('/') || '/';
}
module.exports = {
	basename: _basename,
	normalize: _normalize,
	join: _join,
	resolve: _resolve,
	dirname: _dirname,
	win32: {
		basename: _basename,
		normalize: _normalize,
		join: _join,
		resolve: _resolve,
		dirname: _dirname,
	}
};
