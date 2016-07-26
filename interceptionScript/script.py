from org.jboss.seam.contexts import Context, Contexts
from javax.faces.context import FacesContext
from org.xdi.util import StringHelper, ArrayHelper
from java.util import Arrays, ArrayList, HashMap, IdentityHashMap
from org.xdi.oxauth.client import TokenClient, TokenRequest, UserInfoClient
from org.xdi.oxauth.model.common import GrantType, AuthenticationMethod
from org.xdi.oxauth.model.jwt import Jwt, JwtClaimName
from org.jboss.seam.security import Identity
from org.xdi.model.custom.script.type.auth import PersonAuthenticationType
from org.xdi.oxauth.service import UserService, ClientService, AuthenticationService
from org.xdi.oxauth.model.common import User
from org.xdi.util import StringHelper
from org.xdi.oxauth.util import ServerUtil
try:
    import json
except ImportError:
    import simplejson as json
try:
    import time
except Exception,err:
    print("Error while importing time module. Error: "+str(err))
import java

class PersonAuthentication(PersonAuthenticationType):

    def __init__(self, currentTimeMillis):
        self.currentTimeMillis = currentTimeMillis

    def logwrite(self, msg):
        try:
            localtime = time.asctime( time.localtime(time.time()) )
            target = open("/etc/log/generic.log", 'a+')
            target.write(localtime+" : "+str(msg)+"\n")
            target.close()
        except Exception,err:
            print("File Handling Error"+err)

    def init(self, configurationAttributes):
        print "Basic. Initialization init method call ^&"
        print "Basic. Initialized successfully"
        self.extensionModule = None
        self.attributesMapping = None
        if (configurationAttributes.containsKey("generic_remote_attributes_list") and
            configurationAttributes.containsKey("generic_local_attributes_list")):

            remoteAttributesList = configurationAttributes.get("generic_remote_attributes_list").getValue2()
            if (StringHelper.isEmpty(remoteAttributesList)):
                print "Initialization. The property generic_remote_attributes_list is empty"
                return False

            localAttributesList = configurationAttributes.get("generic_local_attributes_list").getValue2()
            if (StringHelper.isEmpty(localAttributesList)):
                print "Initialization. The property generic_local_attributes_list is empty"
                return False

            self.attributesMapping = self.prepareAttributesMapping(remoteAttributesList, localAttributesList)
            if (self.attributesMapping == None):
                print "Initialization. The attributes mapping isn't valid"
                return False
        if (configurationAttributes.containsKey("extension_module")):
            extensionModuleName = configurationAttributes.get("extension_module").getValue2()
            try:
                self.extensionModule = __import__(extensionModuleName)
                extensionModuleInitResult = self.extensionModule.init(configurationAttributes)
                if (not extensionModuleInitResult):
                    return False
            except ImportError, ex:
                print "Initialization. Failed to load generic_extension_module:", extensionModuleName
                print "Initialization. Unexpected error:", ex
                return False
        else:
            print("Extension module key not found")
        return True

    def destroy(self, configurationAttributes):
        print "Basic. Destroy destroy method call ^&"
        print "Basic. Destroyed successfully"
        return True

    def getApiVersion(self):
        return 1

    def isValidAuthenticationMethod(self, usageType, configurationAttributes):
        return True

    def getAlternativeAuthenticationMethod(self, usageType, configurationAttributes):
        return None

    def getUserValueFromAuth(self,remote_attr,requestParameters):
        try:
            val=ServerUtil.getFirstValue(requestParameters, "loginForm:"+remote_attr)
            return val.decode('utf-8')
        except Exception,err:
            print("Exception inside getUserValueFromAuth "+str(err))

    def authenticate(self, configurationAttributes, requestParameters, step):
        try:
            UserEmail=self.getUserValueFromAuth("email",requestParameters)
        except Exception,err:
            self.logwrite("error: "+str(err))

        # Check if user uses basic method to log in
        useBasicAuth = False
        if (StringHelper.isEmptyString(UserEmail)):
            useBasicAuth = True

        # Use basic method to log in
        if (useBasicAuth):
            print "Basic Authentication"
            credentials = Identity.instance().getCredentials()
            user_name = credentials.getUsername()
            user_password = credentials.getPassword()
            logged_in = False
            
            if (StringHelper.isNotEmptyString(user_name) and StringHelper.isNotEmptyString(user_password)):
                userService = UserService.instance()
                logged_in = userService.authenticate(user_name, user_password)
            
            if (not logged_in):
                return False
            return True

        else:
            try:
                userService = UserService.instance()
                authenticationService = AuthenticationService.instance()
                foundUser = userService.getUserByAttribute("oxExternalUid",self.getUserValueFromAuth("provider",requestParameters)+":" + self.getUserValueFromAuth(self.getUidRemoteAttr(),requestParameters))

                if (foundUser == None):
                    newUser = User()
                    for attributesMappingEntry in self.attributesMapping.entrySet():
                        remoteAttribute = attributesMappingEntry.getKey()
                        localAttribute = attributesMappingEntry.getValue()
                        localAttributeValue = self.getUserValueFromAuth(remoteAttribute,requestParameters)
                        print("Key: "+ localAttribute+ "  |||   value: "+ localAttributeValue)
                        if ((localAttribute != None) & (localAttributeValue != "undefined")):
                            newUser.setAttribute(localAttribute,localAttributeValue)
                    newUser.setAttribute("oxExternalUid", self.getUserValueFromAuth("provider",requestParameters)+":" +self.getUserValueFromAuth(self.getUidRemoteAttr(),requestParameters))
                    print (self.getUserValueFromAuth("provider",requestParameters)+"Authenticate for step 1. Attempting to add user "+ self.getUserValueFromAuth(self.getUidRemoteAttr(),requestParameters))
                    self.logwrite(self.getUserValueFromAuth(self.getUidRemoteAttr(),requestParameters))
                    
                    try:
                        foundUser = userService.addUser(newUser, True)
                        foundUserName = foundUser.getUserId()
                        self.logwrite("found user name "+foundUserName)
                        userAuthenticated = authenticationService.authenticate(foundUserName)
                    except Exception,err:
                        print(str(err)+"error add user")
                        self.logwrite(str(err)+"error add user")
                    return True

                else:
                    foundUserName = foundUser.getUserId()
                    print("User Found "+str(foundUserName))
                    userAuthenticated = authenticationService.authenticate(foundUserName)
                    print(userAuthenticated)
                    return True

            except Exception,err:
                self.logwrite("Error occure during request parameter fatchi"+str(err))
                print ("Error occure during request parameter fatching "+str(err))
        
    def prepareForStep(self, configurationAttributes, requestParameters, step):
        if (step == 1):
            print "Basic. Prepare for Step 1 method call ^&"
            return True
        else:
            return True

    def getExtraParametersForStep(self, configurationAttributes, step):
        return None

    def getCountAuthenticationSteps(self, configurationAttributes):
        return 1

    def getPageForStep(self, configurationAttributes, step):
        if (step == 1):
            return "/auth/generic/genericlogin.xhtml"
        return "/auth/generic/genericpostlogin.xhtml"

    def logout(self, configurationAttributes, requestParameters):
        return True

    def extensionPostLogin(self, configurationAttributes, user):
        if (self.extensionModule != None):
            try:
                postLoginResult = self.extensionModule.postLogin(configurationAttributes, user)
                print "PostLogin result:", postLoginResult
                return postLoginResult
            except Exception, ex:
                print "PostLogin. Failed to execute postLogin method"
                print "PostLogin. Unexpected error:", ex
                return False
            except java.lang.Throwable, ex:
                print "PostLogin. Failed to execute postLogin method"
                ex.printStackTrace()
                return False
        return True

    def prepareAttributesMapping(self, remoteAttributesList, localAttributesList):
        try:
            remoteAttributesListArray = StringHelper.split(remoteAttributesList, ",")
            if (ArrayHelper.isEmpty(remoteAttributesListArray)):
                print(" PrepareAttributesMapping. There is no attributes specified in remoteAttributesList property")
                return None

            localAttributesListArray = StringHelper.split(localAttributesList, ",")
            if (ArrayHelper.isEmpty(localAttributesListArray)):
                print("PrepareAttributesMapping. There is no attributes specified in localAttributesList property")
                return None

            if (len(remoteAttributesListArray) != len(localAttributesListArray)):
                print("PrepareAttributesMapping. The number of attributes in remoteAttributesList and localAttributesList isn't equal")
                return None

            attributeMapping = IdentityHashMap()
            containsUid = False
            i = 0
            count = len(remoteAttributesListArray)
            while (i < count):
                remoteAttribute = StringHelper.toLowerCase(remoteAttributesListArray[i])
                localAttribute = StringHelper.toLowerCase(localAttributesListArray[i])
                attributeMapping.put(remoteAttribute, localAttribute)
                if (StringHelper.equalsIgnoreCase(localAttribute, "uid")):
                    containsUid = True

                i = i + 1

            if (not containsUid):
                print "PrepareAttributesMapping. There is no mapping to mandatory 'uid' attribute"
                return None

            return attributeMapping
        except Exception,err:
            print("Exception inside prepareAttributesMapping "+str(err))

    def getUidRemoteAttr(self):
        try:
            for attributesMappingEntry in self.attributesMapping.entrySet():
                            remoteAttribute = attributesMappingEntry.getKey()
                            localAttribute = attributesMappingEntry.getValue()
                            if localAttribute=="uid":
                                return remoteAttribute
            else:
                return "Not Get UID related remote attribute"
        except Exception,err:
            print("Exception inside getUidRemoteattr "+str(err))

