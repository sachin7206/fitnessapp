#!/bin/bash

echo "🚀 Setting up Maven Wrapper for Backend..."
echo ""

cd backend

# Create .mvn directory
mkdir -p .mvn/wrapper

# Download Maven Wrapper jar
echo "📦 Downloading Maven Wrapper..."
curl -o .mvn/wrapper/maven-wrapper.jar https://repo1.maven.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper.jar

# Download Maven Wrapper properties
cat > .mvn/wrapper/maven-wrapper.properties << 'EOF'
distributionUrl=https://repo1.maven.org/maven2/org/apache/maven/apache-maven/3.9.6/apache-maven-3.9.6-bin.zip
wrapperUrl=https://repo1.maven.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper.jar
EOF

# Create mvnw script
cat > mvnw << 'EOF'
#!/bin/sh
# Maven Wrapper script

MAVEN_PROJECTBASEDIR="${MAVEN_BASEDIR:-$(cd "$(dirname "$0")" && pwd)}"
MAVEN_WRAPPER_JAR="$MAVEN_PROJECTBASEDIR/.mvn/wrapper/maven-wrapper.jar"

exec java -classpath "$MAVEN_WRAPPER_JAR" \
  "-Dmaven.multiModuleProjectDirectory=$MAVEN_PROJECTBASEDIR" \
  org.apache.maven.wrapper.MavenWrapperMain "$@"
EOF

chmod +x mvnw

echo "✅ Maven Wrapper installed successfully!"
echo ""
echo "You can now run: ./mvnw spring-boot:run"

