import SftpClient from 'ssh2-sftp-client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const sftp = new SftpClient()

async function main() {
	if (process.env.SRC_DIR === undefined) throw 'process.env.SRC_DIR === undefined'
	if (process.env.VPS_REMOTE_DIR === undefined) throw 'process.env.VPS_REMOTE_DIR === undefined'
	if (process.env.VPS_HOST === undefined) throw 'process.env.VPS_HOST === undefined'
	if (process.env.VPS_USERNAME === undefined) throw 'process.env.VPS_USERNAME === undefined'
	if (process.env.VPS_PASSWORD === undefined) throw 'process.env.VPS_PASSWORD === undefined'

	await sftp.connect({
		host: process.env.VPS_HOST,
		username: process.env.VPS_USERNAME,
		password: process.env.VPS_PASSWORD,
	})

	try {
		await sftp.rmdir(process.env.VPS_REMOTE_DIR, true)
	} catch (error) {
		console.log(`${process.env.VPS_REMOTE_DIR} has not existed yet.`)
	}
	const res = await sftp.uploadDir(process.env.SRC_DIR, process.env.VPS_REMOTE_DIR)
	console.log(res)
	const list = await sftp.list(process.env.VPS_REMOTE_DIR)
	console.log(
		list.map((item) => {
			return { name: item.name, type: item.type === 'd' ? 'folder' : 'file' }
		})
	)
}

main()
	.then(() => {
		console.log('Done!')
		process.exit(0)
	})
	.catch((error) => {
		console.error(error)
		process.exit(0)
	})
