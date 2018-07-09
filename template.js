function createPage(title, body){
	var page = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<title>${title}</title>
		<link rel="stylesheet" href="styles/main.css">
	</head>
	<body>
		<nav>
			<ul class="frame">
				<li><button ID="close">&times;</button></li>
				<li><button ID="maximize">+</button></li>
				<li><button ID="minimize">-</button></li>
			</ul>
		</nav>
		
		<div>
			<ul class="topbar">
				<li ID="openFile">open</li>
				<li>upload</li>
				<li>download</li>
				<li>extensions</li>
			</ul>
			
			<ul class="sidebar-left">
				<li>a</li>
				<li>b</li>
				<li>c</li>
			</ul>

			<ul class="filebar">
				<li>test1</li>
				<li>test2</li>
				<li>test3</li>
			</ul>
				
			<main ID="buildArea">
				${body}
				<div class="componentArea">
					<p class="head">area 1</p>

					<div class="block">
						<p>block</p>
						<input type="checkbox" class="blockToggle">
						<div class="inputArea">
							<ul>
								<li><input></li>
								<li><input type="number"></li>
								<li><input type="checkbox"></li>
							<ul>
						</div>
					</div>

					<div class="block">
						<p>block</p>
						<input type="checkbox" class="blockToggle">
						<div class="inputArea">
							<ul>
								<li><input></li>
								<li><input type="number"></li>
								<li><input type="checkbox"></li>

								<div class="block">
									<p>2) block</p>
									<input type="checkbox" class="blockToggle">
									<div class="inputArea">
										<ul>
											<li><input></li>
											<li><input type="number"></li>
											<li><input type="checkbox"></li>
										<ul>
									</div>
								</div>
							<ul>
						</div>
					</div>

					<div class="block">
						<p>block</p>
						<input type="checkbox" class="blockToggle">
						<div class="inputArea">
							<ul>
								<li><input></li>
								<li><input type="number"></li>
								<li><input type="checkbox"></li>

								<div class="block">
									<p>2) block</p>
									<input type="checkbox" class="blockToggle">
									<div class="inputArea">
										<ul>
											<li><input></li>
											<li><input type="number"></li>
											<li><input type="checkbox"></li>
										<ul>
									</div>
								</div>
							<ul>
						</div>
					</div>

					<p class="blockPlus">+</p>
				</div>

				<div class="componentArea">
					<p class="head">area 2</p>
					<p class="blockPlus">+</p>
				</div>
			</main>
		</div>
	
		<div ID="context-menu-wrapper">
			<button ID="close-context-menu">&times;</button>
			<ul class="context-menu">
				<li class="context-menu-item">
					<p>Element 1</p>
				</li>
				<li class="context-menu-item">
					<p>Element 2</p>
				</li>
				<li class="context-menu-item">
					<p>Element 3</p>
				</li>
				<li class="context-menu-item">
					<p>Element 4</p>
				</li>
				<li class="context-menu-item">
					<p>Element 5</p>
				</li>
			</ul>
		</div>

		<script src="scripts/windowFrame.js"></script>
	</body>
	</html>
	`;

	document.write(page);
}


module.exports.createPage = createPage;