export default function healthCheck(req, res) {
    res.status(200).json({ status: 'Healthy', timestamp: new Date().toISOString() });
}