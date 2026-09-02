const NotifCard = ({ children }) => {
return (
/*
Matching the design:
- White background (bg-white)
- Light gray border (border-gray-200)
- Rounded corners (rounded-lg)
- Consistent padding (p-8)
*/
<div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm transition-shadow">
{children}
</div>
)
}

export default NotifCard